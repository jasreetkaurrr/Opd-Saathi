import React from 'react';
import { PLACES, PLACE_MAP } from '../data/hospital.js';
import { useHospital } from '../context/HospitalContext.jsx';
import { formatStr } from '../i18n/index.js';

function shortenLabel(text, max = 20) {
  if (!text) return '';
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

export function FloorPlanSvg({
  floor = 0,
  route = null,
  activeStepPlaceId = null,
  isEmergencyRoute = false,
  onSelectPlace = null,
  showLegend = true,
}) {
  const { dict } = useHospital();

  const floorPlaces = PLACES.filter((p) => p.floor === floor);
  const startId = route?.placeIds?.[0] || null;
  const endId = route?.placeIds?.[route.placeIds.length - 1] || null;
  const routeIdSet = new Set(route?.placeIds || []);

  // Build polyline segments that lie on this floor
  const floorEdges = (route?.edges || []).filter((e) => {
    const a = PLACE_MAP[e.from];
    const b = PLACE_MAP[e.to];
    return a && b && a.floor === floor && b.floor === floor;
  });

  // Detect floor transition (e.g., entering lift_g to go to lift_1)
  const outgoingVerticalEdge = (route?.edges || []).find((e) => {
    const a = PLACE_MAP[e.from];
    const b = PLACE_MAP[e.to];
    return a && b && a.floor === floor && b.floor !== floor;
  });

  const routeColor = isEmergencyRoute ? '#C83E37' : '#2563EB';
  const destColor = '#C83E37';

  return (
    <div className="w-full rounded-2xl border border-paper-border bg-white overflow-hidden shadow-soft hc-card">
      <svg
        viewBox="0 0 860 540"
        role="img"
        aria-label={`${dict.wayfinding.floorMapTitle} — ${dict.floors[floor]}`}
        className="w-full h-auto block select-none"
      >
        <defs>
          <marker
            id={`arrow-${floor}-${isEmergencyRoute ? 'em' : 'std'}`}
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerWidth="5.5"
            markerHeight="5.5"
            orient="auto-start-reverse"
          >
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill={routeColor} />
          </marker>
          <pattern id="blueprintGrid" width="36" height="36" patternUnits="userSpaceOnUse">
            <path d="M 36 0 L 0 0 0 36" fill="none" stroke="#E9EFF5" strokeWidth="1" />
          </pattern>
          <pattern
            id="rampPattern"
            width="10"
            height="10"
            patternTransform="rotate(45 0 0)"
            patternUnits="userSpaceOnUse"
          >
            <line x1="0" y1="0" x2="0" y2="10" stroke="#2C6456" strokeWidth="2.2" strokeOpacity="0.3" />
          </pattern>
        </defs>

        {/* Outer Architectural Blueprint Slab */}
        <rect x="14" y="14" width="832" height="512" rx="18" fill="#F7F9FB" stroke="#C6D4E1" strokeWidth="2.5" />
        <rect x="16" y="16" width="828" height="508" rx="16" fill="url(#blueprintGrid)" />

        {/* Architectural Corridors per Floor */}
        {floor === 0 && (
          <g>
            <rect x="60" y="165" width="750" height="75" rx="8" fill="#EEF3F7" />
            <rect x="150" y="330" width="560" height="90" rx="10" fill="#EEF3F7" />
            <rect x="215" y="165" width="90" height="310" rx="8" fill="#EEF3F7" />
            <rect x="435" y="165" width="80" height="295" rx="8" fill="#EEF3F7" />
            {/* Direct level Emergency walkway from Entrance */}
            <path
              d="M 515 490 L 615 460"
              stroke="#FADCD9"
              strokeWidth="20"
              strokeLinecap="round"
            />
            {/* Front steps indicator */}
            <g stroke="#9EB0C2" strokeWidth="2">
              <line x1="408" y1="432" x2="452" y2="432" />
              <line x1="408" y1="441" x2="452" y2="441" />
              <line x1="408" y1="450" x2="452" y2="450" />
            </g>
          </g>
        )}

        {floor === 1 && (
          <g>
            <rect x="55" y="165" width="760" height="72" rx="8" fill="#EEF3F7" />
            <rect x="55" y="332" width="760" height="64" rx="8" fill="#EEF3F7" />
            <rect x="222" y="165" width="76" height="230" rx="8" fill="#EEF3F7" />
            <rect x="636" y="165" width="60" height="230" rx="8" fill="#EEF3F7" />
          </g>
        )}

        {floor === 2 && (
          <g>
            <rect x="55" y="172" width="755" height="65" rx="8" fill="#EEF3F7" />
            <rect x="55" y="334" width="755" height="55" rx="8" fill="#EEF3F7" />
            <rect x="220" y="172" width="72" height="215" rx="8" fill="#EEF3F7" />
            <rect x="480" y="172" width="72" height="215" rx="8" fill="#EEF3F7" />
          </g>
        )}

        {/* Floor Pill Badge in Top-Left */}
        <g transform="translate(32, 36)">
          <rect x="0" y="-18" width="176" height="26" rx="7" fill="#1C443D" />
          <text x="88" y="-1" textAnchor="middle" fill="#FFFFFF" fontSize="13" fontWeight="800">
            {dict.floors[floor]}
          </text>
        </g>

        {/* Render Every Place Box on This Floor */}
        {floorPlaces.map((place) => {
          const { x, y, w, h } = place.box;
          const isStart = place.id === startId;
          const isEnd = place.id === endId;
          const isOnRoute = routeIdSet.has(place.id);
          const isActiveStep = place.id === activeStepPlaceId;
          const placeTxt = dict.places[place.id] || { name: place.id, landmark: '' };

          let fill = '#DFEAEE';
          let stroke = '#B2C4D4';
          let textFill = '#18302B';

          if (place.category === 'emergency') {
            fill = '#FCEAE8';
            stroke = '#C83E37';
            textFill = '#7D201B';
          } else if (place.category === 'access') {
            fill = place.id === 'ramp_g' ? 'url(#rampPattern)' : '#DCE8F8';
            stroke = '#3B6EC2';
          } else if (place.id === 'waiting_a') {
            fill = '#E6EFF8';
            stroke = '#7FA4CE';
          } else if (place.category === 'opd') {
            fill = '#E3ECEF';
            stroke = '#AAC0CF';
          } else if (place.category === 'support') {
            fill = '#EDEBE2';
            stroke = '#C5BEA8';
          }

          if (isEnd) {
            stroke = destColor;
            fill = '#FCEAE8';
            textFill = '#7D201B';
          } else if (isStart) {
            stroke = '#2563EB';
            fill = '#DBEAFE';
          } else if (isOnRoute) {
            stroke = routeColor;
          }

          return (
            <g
              key={place.id}
              onClick={onSelectPlace ? () => onSelectPlace(place.id) : undefined}
              style={{ cursor: onSelectPlace ? 'pointer' : 'default' }}
            >
              {/* Architectural Room Block */}
              <rect
                x={x}
                y={y}
                width={w}
                height={h}
                rx="8"
                fill={fill}
                stroke={stroke}
                strokeWidth={isEnd || isStart || isActiveStep ? 3.5 : isOnRoute ? 2.5 : 1.5}
              />

              {/* Room Number Pill for OPD Rooms 1 to 8 */}
              {place.roomNumber && (
                <g>
                  <rect
                    x={x + 8}
                    y={y + 8}
                    width="48"
                    height="23"
                    rx="5"
                    fill={isEnd ? destColor : '#2C6456'}
                  />
                  <text
                    x={x + 32}
                    y={y + 24}
                    textAnchor="middle"
                    fill="#FFFFFF"
                    fontSize="12.5"
                    fontWeight="800"
                  >
                    {formatStr(dict.wayfinding.roomMapBadge, { room: place.roomNumber })}
                  </text>
                </g>
              )}

              {/* Lift Blue Square Badge */}
              {place.id.startsWith('lift_') && (
                <g transform={`translate(${x + w / 2 - 12}, ${y + 8})`} aria-hidden="true">
                  <rect width="24" height="20" rx="4" fill="#2563EB" />
                  <path d="M8 12l4-5 4 5M12 7v8" stroke="#FFFFFF" strokeWidth="2" fill="none" strokeLinecap="round" />
                </g>
              )}

              {/* Special Landmark Graphics: Blue Chairs inside Waiting Hall A */}
              {place.id === 'waiting_a' && (
                <g aria-hidden="true">
                  {[0, 1, 2, 3, 4, 5].map((chairIdx) => (
                    <rect
                      key={`top-chair-${chairIdx}`}
                      x={x + 34 + chairIdx * 44}
                      y={y + 12}
                      width="26"
                      height="12"
                      rx="3"
                      fill="#3B82F6"
                    />
                  ))}
                  {[0, 1, 2, 3, 4, 5].map((chairIdx) => (
                    <rect
                      key={`bot-chair-${chairIdx}`}
                      x={x + 34 + chairIdx * 44}
                      y={y + h - 22}
                      width="26"
                      height="12"
                      rx="3"
                      fill="#3B82F6"
                    />
                  ))}
                </g>
              )}

              {/* Special Landmark Graphic: Red Cross inside Emergency */}
              {place.id === 'emergency' && (
                <g transform={`translate(${x + w - 40}, ${y + 10})`} aria-hidden="true">
                  <rect x="0" y="0" width="28" height="28" rx="6" fill="#C83E37" />
                  <path d="M14 6v16M6 14h16" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" />
                </g>
              )}

              {/* Place Name Text */}
              <text
                x={place.x}
                y={
                  place.roomNumber
                    ? y + 54
                    : place.id.startsWith('lift_')
                    ? y + 48
                    : place.id === 'waiting_a'
                    ? y + 50
                    : y + h / 2 + 4
                }
                textAnchor="middle"
                fill={textFill}
                fontSize={place.category === 'access' && w < 100 ? '11.5' : '13'}
                fontWeight="800"
              >
                {shortenLabel(
                  place.roomNumber
                    ? placeTxt.name.replace(/^OPD\s*/i, '')
                    : placeTxt.name,
                  w < 100 ? 10 : w < 155 ? 18 : 28
                )}
              </text>

              {/* Sub-caption for Emergency 24x7 */}
              {place.id === 'emergency' && (
                <text
                  x={place.x}
                  y={y + h / 2 + 25}
                  textAnchor="middle"
                  fill="#9E2A25"
                  fontSize="12.5"
                  fontWeight="800"
                >
                  24×7 • 112 / 108
                </text>
              )}
            </g>
          );
        })}

        {/* Draw Dashed Blueprint Route Path Segments on This Floor */}
        {floorEdges.map((edge, idx) => {
          const a = PLACE_MAP[edge.from];
          const b = PLACE_MAP[edge.to];
          if (!a || !b) return null;
          return (
            <g key={`${edge.from}-${edge.to}-${idx}`}>
              <line
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke="#FFFFFF"
                strokeWidth="10"
                strokeLinecap="round"
              />
              <line
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke={routeColor}
                strokeWidth="5"
                strokeLinecap="round"
                className="route-path-animated"
                markerEnd={`url(#arrow-${floor}-${isEmergencyRoute ? 'em' : 'std'})`}
              />
            </g>
          );
        })}

        {/* Waypoint Dots Along Route on This Floor */}
        {(route?.placeIds || []).map((pid, idx) => {
          const p = PLACE_MAP[pid];
          if (!p || p.floor !== floor) return null;
          const isFirst = idx === 0;
          const isLast = idx === route.placeIds.length - 1;
          const isCurrentWalk = pid === activeStepPlaceId;

          const pinFill = isFirst ? '#2563EB' : isLast ? destColor : '#FFFFFF';
          const pinStroke = isFirst ? '#FFFFFF' : isLast ? '#FFFFFF' : routeColor;

          return (
            <g key={`wp-${pid}-${idx}`}>
              {(isFirst || isLast || isCurrentWalk) && (
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isCurrentWalk ? '22' : '18'}
                  fill={isFirst ? '#2563EB' : destColor}
                  fillOpacity="0.2"
                />
              )}
              <circle
                cx={p.x}
                cy={p.y}
                r={isFirst || isLast ? '11' : '6.5'}
                fill={pinFill}
                stroke={pinStroke}
                strokeWidth="3"
              />
              {(isFirst || isLast) && (
                <g transform={`translate(${p.x}, ${Math.max(26, p.box.y - 10)})`}>
                  <rect
                    x="-58"
                    y="-22"
                    width="116"
                    height="24"
                    rx="12"
                    fill={isFirst ? '#2563EB' : destColor}
                  />
                  <text
                    x="0"
                    y="-5"
                    textAnchor="middle"
                    fill="#FFFFFF"
                    fontSize="12"
                    fontWeight="800"
                  >
                    {isFirst ? dict.wayfinding.youAreHere : dict.wayfinding.destinationPin}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* Floor Transition Callout Pill */}
        {outgoingVerticalEdge &&
          (() => {
            const shaft = PLACE_MAP[outgoingVerticalEdge.from];
            const nextShaft = PLACE_MAP[outgoingVerticalEdge.to];
            if (!shaft || !nextShaft) return null;
            const nextFloorLabel = dict.floors[`short${nextShaft.floor}`] || dict.floors[nextShaft.floor];
            return (
              <g transform={`translate(${shaft.x}, ${shaft.box.y - 14})`}>
                <rect x="-78" y="-24" width="156" height="25" rx="12" fill="#2563EB" />
                <text x="0" y="-7" textAnchor="middle" fill="#FFFFFF" fontSize="12" fontWeight="800">
                  ↑ {nextFloorLabel}
                </text>
              </g>
            );
          })()}
      </svg>

      {/* Clean Map Legend Bar matching Reference Mockup */}
      {showLegend && route && (
        <div className="px-4 py-2.5 bg-paper-card border-t border-paper-border flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-sm font-bold text-ink-muted hc-muted">
          <span className="inline-flex items-center gap-2">
            <span
              className="w-6 border-t-3 border-dashed"
              style={{ borderColor: routeColor }}
              aria-hidden="true"
            />
            <span>{dict.wayfinding.legendRoute}</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full bg-[#2563EB] ring-4 ring-[#DBEAFE]" aria-hidden="true" />
            <span>{dict.wayfinding.legendYou}</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full bg-[#C83E37] ring-4 ring-[#FCEAE8]" aria-hidden="true" />
            <span>{dict.wayfinding.legendRoom}</span>
          </span>
        </div>
      )}
    </div>
  );
}
