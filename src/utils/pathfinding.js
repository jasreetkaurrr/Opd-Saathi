import { PLACES, PATHS, PLACE_MAP } from '../data/hospital.js';
import { formatStr } from '../i18n/index.js';

/**
 * Build adjacency list from hospital PATHS.
 * When avoidStairs is true, any edge with usesStairs === true is excluded.
 */
function buildAdjacency(avoidStairs = false) {
  const adj = {};
  for (const place of PLACES) {
    adj[place.id] = [];
  }
  for (const edge of PATHS) {
    if (avoidStairs && edge.usesStairs) continue;
    if (adj[edge.from] && adj[edge.to]) {
      adj[edge.from].push({ ...edge, from: edge.from, to: edge.to });
      adj[edge.to].push({ ...edge, from: edge.to, to: edge.from });
    }
  }
  return adj;
}

/**
 * Dijkstra's shortest path between two place IDs.
 * Returns { placeIds, edges, totalDistance, usesStairs, walkMinutes, floorSegments } or null.
 */
export function findShortestRoute(fromId, toId, { avoidStairs = false } = {}) {
  if (!PLACE_MAP[fromId] || !PLACE_MAP[toId]) return null;

  if (fromId === toId) {
    const p = PLACE_MAP[fromId];
    return {
      placeIds: [fromId],
      edges: [],
      totalDistance: 0,
      usesStairs: false,
      walkMinutes: 1,
      floorSegments: [{ floor: p.floor, placeIds: [fromId] }],
    };
  }

  const adj = buildAdjacency(avoidStairs);
  const dist = {};
  const prev = {};
  const prevEdge = {};
  const visited = new Set();

  for (const p of PLACES) {
    dist[p.id] = Infinity;
  }
  dist[fromId] = 0;

  while (true) {
    let closest = null;
    let bestDist = Infinity;
    for (const id of Object.keys(dist)) {
      if (!visited.has(id) && dist[id] < bestDist) {
        bestDist = dist[id];
        closest = id;
      }
    }
    if (closest === null || closest === toId) break;
    visited.add(closest);

    for (const neighbor of adj[closest] || []) {
      if (visited.has(neighbor.to)) continue;
      const alt = dist[closest] + neighbor.distance;
      if (alt < dist[neighbor.to]) {
        dist[neighbor.to] = alt;
        prev[neighbor.to] = closest;
        prevEdge[neighbor.to] = neighbor;
      }
    }
  }

  if (!Number.isFinite(dist[toId])) {
    return null;
  }

  const placeIds = [];
  const edges = [];
  let curr = toId;
  while (curr) {
    placeIds.unshift(curr);
    if (prevEdge[curr]) {
      edges.unshift({
        from: prev[curr],
        to: curr,
        distance: prevEdge[curr].distance,
        usesStairs: Boolean(prevEdge[curr].usesStairs),
        viaLift: Boolean(prevEdge[curr].viaLift),
        viaRamp: Boolean(prevEdge[curr].viaRamp),
        stepNote: prevEdge[curr].stepNote || null,
      });
    }
    curr = prev[curr];
  }

  const totalDistance = Math.round(dist[toId]);
  const usesStairs = edges.some((e) => e.usesStairs);
  // Gentle elderly walking speed ~35 metres/minute, min 1 minute
  const walkMinutes = Math.max(1, Math.ceil(totalDistance / 35));

  // Group contiguous places by floor for multi-floor SVG rendering
  const floorSegments = [];
  for (const id of placeIds) {
    const place = PLACE_MAP[id];
    const lastSeg = floorSegments[floorSegments.length - 1];
    if (!lastSeg || lastSeg.floor !== place.floor) {
      floorSegments.push({ floor: place.floor, placeIds: [id] });
    } else {
      lastSeg.placeIds.push(id);
    }
  }

  return {
    placeIds,
    edges,
    totalDistance,
    usesStairs,
    walkMinutes,
    floorSegments,
  };
}

/**
 * Compute relative turn direction between two 2D floor segments (pPrev -> pCurr -> pNext)
 * Note: SVG y-axis points downward, so 2D cross product > 0 means clockwise (Turn right).
 */
function getTurnKey(prevPlace, currPlace, nextPlace) {
  if (!prevPlace || prevPlace.floor !== currPlace.floor || currPlace.floor !== nextPlace.floor) {
    // Exiting lift or stairs onto a new floor: give intuitive turn based on heading from shaft
    if (prevPlace && prevPlace.floor !== currPlace.floor && currPlace.floor === nextPlace.floor) {
      // Lift faces East into the hall on our floor plan (x increases)
      const dy = nextPlace.y - currPlace.y;
      const dx = nextPlace.x - currPlace.x;
      if (dy < -50) return 'turnLeft';
      if (dy > 50) return 'turnRight';
      if (dx > 40) return 'goStraight';
    }
    return 'headTowards';
  }
  const v1x = currPlace.x - prevPlace.x;
  const v1y = currPlace.y - prevPlace.y;
  const v2x = nextPlace.x - currPlace.x;
  const v2y = nextPlace.y - currPlace.y;
  const len1 = Math.hypot(v1x, v1y);
  const len2 = Math.hypot(v2x, v2y);
  if (len1 < 1 || len2 < 1) return 'goStraight';

  const cross = (v1x * v2y - v1y * v2x) / (len1 * len2);
  const dot = (v1x * v2x + v1y * v2y) / (len1 * len2);
  if (dot > 0.82) return 'goStraight';
  return cross > 0 ? 'turnRight' : 'turnLeft';
}

/**
 * Convert a calculated route into plain-word, localized step-by-step instructions with landmarks.
 */
export function buildLocalizedSteps(route, dict) {
  if (!route || !route.placeIds || route.placeIds.length === 0) return [];
  const w = dict.wayfinding;
  const getPlaceText = (id) => dict.places[id] || { name: id, landmark: '' };
  const getFloorText = (floor) => dict.floors[floor] || `Floor ${floor}`;

  if (route.placeIds.length === 1) {
    const id = route.placeIds[0];
    const p = getPlaceText(id);
    return [
      {
        index: 1,
        placeId: id,
        floor: PLACE_MAP[id].floor,
        icon: 'pin',
        text: formatStr(w.samePlaceMsg, { place: p.name, landmark: p.landmark }),
        landmark: p.landmark,
      },
    ];
  }

  const steps = [];
  const ids = route.placeIds;

  // Step 1: Starting point
  const startId = ids[0];
  const startPlace = PLACE_MAP[startId];
  const startTxt = getPlaceText(startId);
  steps.push({
    index: 1,
    placeId: startId,
    floor: startPlace.floor,
    icon: 'start',
    text: formatStr(w.stepStart, {
      place: startTxt.name,
      floor: getFloorText(startPlace.floor),
      landmark: startTxt.landmark,
    }),
    landmark: startTxt.landmark,
  });

  // Intermediate & arrival edges (collapse consecutive multi-floor lift/stairs hops e.g. Ground -> 1st -> 2nd into one smooth lift ride!)
  let i = 0;
  while (i < route.edges.length) {
    const edge = route.edges[i];
    const fromPlace = PLACE_MAP[edge.from];
    const toPlace = PLACE_MAP[edge.to];

    // Collapse consecutive lift segments (e.g., lift_g -> lift_1 -> lift_2)
    if (edge.viaLift) {
      let finalEdge = edge;
      while (i + 1 < route.edges.length && route.edges[i + 1].viaLift) {
        i += 1;
        finalEdge = route.edges[i];
      }
      const exitPlace = PLACE_MAP[finalEdge.to];
      const exitTxt = getPlaceText(finalEdge.to);
      steps.push({
        index: steps.length + 1,
        placeId: finalEdge.to,
        floor: exitPlace.floor,
        icon: 'lift',
        text: formatStr(w.stepLift, {
          toFloor: getFloorText(exitPlace.floor),
          toPlace: exitTxt.name,
          landmark: exitTxt.landmark,
        }),
        landmark: exitTxt.landmark,
      });
      i += 1;
      continue;
    }

    // Collapse consecutive stair segments across floors (stairs_g -> stairs_1 -> stairs_2)
    if (edge.usesStairs && fromPlace.floor !== toPlace.floor) {
      let finalEdge = edge;
      while (
        i + 1 < route.edges.length &&
        route.edges[i + 1].usesStairs &&
        PLACE_MAP[route.edges[i + 1].from].floor !== PLACE_MAP[route.edges[i + 1].to].floor
      ) {
        i += 1;
        finalEdge = route.edges[i];
      }
      const exitPlace = PLACE_MAP[finalEdge.to];
      const exitTxt = getPlaceText(finalEdge.to);
      steps.push({
        index: steps.length + 1,
        placeId: finalEdge.to,
        floor: exitPlace.floor,
        icon: 'stairs',
        text: formatStr(w.stepStairs, {
          toFloor: getFloorText(exitPlace.floor),
          landmark: exitTxt.landmark,
        }),
        landmark: exitTxt.landmark,
      });
      i += 1;
      continue;
    }

    const isLastEdge = i === route.edges.length - 1;
    const toTxt = getPlaceText(edge.to);

    if (edge.to === 'ramp_g') {
      steps.push({
        index: steps.length + 1,
        placeId: edge.to,
        floor: toPlace.floor,
        icon: 'ramp',
        text: formatStr(w.stepRamp, {
          place: toTxt.name,
          landmark: toTxt.landmark,
        }),
        landmark: toTxt.landmark,
      });
    } else if (edge.stepNote === 'front_steps') {
      steps.push({
        index: steps.length + 1,
        placeId: edge.to,
        floor: toPlace.floor,
        icon: 'stairs',
        text: formatStr(w.stepFrontSteps, {
          place: toTxt.name,
          landmark: toTxt.landmark,
        }),
        landmark: toTxt.landmark,
      });
    } else if (!isLastEdge) {
      const prevPlace = i > 0 ? PLACE_MAP[route.edges[i - 1].from] : null;
      const turnKey = getTurnKey(prevPlace, fromPlace, toPlace);
      steps.push({
        index: steps.length + 1,
        placeId: edge.to,
        floor: toPlace.floor,
        icon: turnKey,
        text: formatStr(w.stepWalkTurn, {
          turn: w[turnKey] || w.headTowards,
          distance: edge.distance,
          place: toTxt.name,
          landmark: toTxt.landmark,
        }),
        landmark: toTxt.landmark,
      });
    }

    if (isLastEdge) {
      steps.push({
        index: steps.length + 1,
        placeId: edge.to,
        floor: toPlace.floor,
        icon: 'arrive',
        isArrival: true,
        text: formatStr(w.stepArrive, {
          place: toTxt.name,
          floor: getFloorText(toPlace.floor),
          landmark: toTxt.landmark,
        }),
        landmark: toTxt.landmark,
      });
    }

    i += 1;
  }

  return steps;
}
