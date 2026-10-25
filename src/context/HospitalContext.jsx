import React, { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { DEPARTMENTS, DEPARTMENT_MAP, PATIENT_CATEGORIES } from '../data/departments.js';
import { HOSPITAL_INFO, WAITING_AREAS } from '../data/hospital.js';
import { INITIAL_SEED_PATIENTS, INITIAL_COUNTERS, DEMO_SAMPLE_BATCH_20 } from '../data/patients.js';
import { DICTIONARIES, formatStr } from '../i18n/index.js';

const HOSPITAL_STORAGE_KEY = 'opd_saathi_hospital_v1';
const PREFS_STORAGE_KEY = 'opd_saathi_prefs_v1';
const CHANNEL_NAME = 'opd_saathi_sync_v1';

const HospitalContext = createContext(null);

function formatSimClock(simMinutes) {
  const total = ((Math.floor(simMinutes) % 1440) + 1440) % 1440;
  const hh = String(Math.floor(total / 60)).padStart(2, '0');
  const mm = String(total % 60).padStart(2, '0');
  return `${hh}:${mm}`;
}

function parseClockToMinutes(hhmm) {
  if (!hhmm || typeof hhmm !== 'string') return null;
  const parts = hhmm.split(':');
  if (parts.length !== 2) return null;
  const h = Number(parts[0]);
  const m = Number(parts[1]);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

function buildInitialHospitalState() {
  const startSimMin = HOSPITAL_INFO.defaultStartMinutes;
  const departmentsState = {};
  for (const dept of DEPARTMENTS) {
    departmentsState[dept.id] = {
      doctorStatus: 'available', // 'available' | 'break' | 'late'
      breakUntil: HOSPITAL_INFO.defaultBreakUntil,
      lateMinutes: 0,
      recentDurations: [dept.sampleAvgMinutes],
      servingStartedSimMin: startSimMin - 2,
    };
  }

  const now = Date.now();
  const patients = INITIAL_SEED_PATIENTS.map((p, idx) => ({
    ...p,
    mobile: '',
    createdAt: now - (INITIAL_SEED_PATIENTS.length - idx) * 60000,
    calledAt: p.status === 'serving' ? now - 120000 : null,
  }));

  return {
    version: 1,
    updatedAt: now,
    simMinutes: startSimMin,
    speed10x: false,
    lastTickAt: now,
    counters: { ...INITIAL_COUNTERS },
    departmentsState,
    patients,
    urgentFlags: [],
    lastCalledEvent: {
      id: 'init-call',
      token: 'MED-034',
      roomNumber: 1,
      departmentId: 'med_1',
      timestamp: now - 60000,
    },
  };
}

function loadHospitalState() {
  try {
    const raw = window.localStorage.getItem(HOSPITAL_STORAGE_KEY);
    if (!raw) {
      const initial = buildInitialHospitalState();
      window.localStorage.setItem(HOSPITAL_STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.patients) || !parsed.departmentsState) {
      const initial = buildInitialHospitalState();
      window.localStorage.setItem(HOSPITAL_STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    return parsed;
  } catch {
    return buildInitialHospitalState();
  }
}

function loadPrefsState() {
  const defaults = {
    langChosen: false,
    lang: 'en',
    textSize: 'normal', // 'normal' | 'large' | 'xlarge'
    highContrast: false,
    readAloud: false,
    avoidStairs: false,
    assistedMode: false,
    myTokens: [],
  };
  try {
    const raw = window.localStorage.getItem(PREFS_STORAGE_KEY);
    if (!raw) return defaults;
    return { ...defaults, ...JSON.parse(raw) };
  } catch {
    return defaults;
  }
}

export function computeAvgConsultMinutes(deptId, departmentsState) {
  const dept = DEPARTMENT_MAP[deptId];
  const fallback = dept ? dept.sampleAvgMinutes : 5;
  const ds = departmentsState?.[deptId];
  if (!ds || !Array.isArray(ds.recentDurations) || ds.recentDurations.length === 0) {
    return fallback;
  }
  const last10 = ds.recentDurations.slice(-10);
  const sum = last10.reduce((acc, v) => acc + (Number(v) || fallback), 0);
  return sum / last10.length;
}

export function computeDoctorDelayMinutes(deptId, departmentsState, simMinutes) {
  const ds = departmentsState?.[deptId];
  if (!ds) return 0;
  if (ds.doctorStatus === 'late') {
    return Math.max(0, Number(ds.lateMinutes) || 15);
  }
  if (ds.doctorStatus === 'break') {
    const untilMin = parseClockToMinutes(ds.breakUntil);
    if (untilMin !== null && simMinutes !== undefined) {
      const diff = untilMin - simMinutes;
      return diff > 0 ? diff : 15;
    }
    return 15;
  }
  return 0;
}

/**
 * Round estimated wait to nearest 5 minutes per specification:
 * Estimated wait = (peopleAhead * avgConsultLast10) + doctorDelay
 * Round to 5 minutes, shown as "about X minutes".
 */
export function computeRoundedWaitMinutes(peopleAhead, avgConsult, doctorDelay) {
  const raw = Math.max(0, peopleAhead) * avgConsult + Math.max(0, doctorDelay);
  if (raw <= 0) return 0;
  return Math.max(5, Math.round(raw / 5) * 5);
}

export function HospitalProvider({ children }) {
  const [hospitalState, setHospitalState] = useState(() => loadHospitalState());
  const [prefs, setPrefs] = useState(() => loadPrefsState());
  const hospitalStateRef = useRef(hospitalState);
  const prefsRef = useRef(prefs);
  const channelRef = useRef(null);
  const tabIdRef = useRef(`tab-${Math.random().toString(36).slice(2, 10)}`);

  useEffect(() => {
    hospitalStateRef.current = hospitalState;
  }, [hospitalState]);

  useEffect(() => {
    prefsRef.current = prefs;
  }, [prefs]);

  // Setup BroadcastChannel + storage event listener for live cross-tab sync
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    let bc = null;
    if ('BroadcastChannel' in window) {
      bc = new window.BroadcastChannel(CHANNEL_NAME);
      channelRef.current = bc;
      bc.onmessage = (event) => {
        const msg = event.data;
        if (msg && msg.type === 'HOSPITAL_STATE_SYNC' && msg.sender !== tabIdRef.current && msg.payload) {
          hospitalStateRef.current = msg.payload;
          setHospitalState(msg.payload);
        }
      };
    }

    const handleStorage = (e) => {
      if (e.key === HOSPITAL_STORAGE_KEY && e.newValue) {
        try {
          const next = JSON.parse(e.newValue);
          if (next && Array.isArray(next.patients)) {
            hospitalStateRef.current = next;
            setHospitalState(next);
          }
        } catch {
          // ignore parse error
        }
      } else if (e.key === PREFS_STORAGE_KEY && e.newValue) {
        try {
          const merged = { ...prefsRef.current, ...JSON.parse(e.newValue) };
          prefsRef.current = merged;
          setPrefs(merged);
        } catch {
          // ignore
        }
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
      if (bc) bc.close();
      channelRef.current = null;
    };
  }, []);

  // Apply root accessibility classes/attributes for text size, high contrast, and language
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const html = document.documentElement;
    html.lang = prefs.lang === 'hi' ? 'hi' : 'en';
    html.dataset.textSize = prefs.textSize || 'normal';
    html.dataset.contrast = prefs.highContrast ? 'high' : 'normal';
  }, [prefs.lang, prefs.textSize, prefs.highContrast]);

  const updatePrefs = useCallback((updater) => {
    const prev = prefsRef.current;
    const patch = typeof updater === 'function' ? updater(prev) : updater;
    const next = { ...prev, ...patch };
    prefsRef.current = next;
    try {
      window.localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
    setPrefs(next);
  }, []);

  const commitHospitalState = useCallback((recipe) => {
    let base = hospitalStateRef.current;
    try {
      const raw = window.localStorage.getItem(HOSPITAL_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.updatedAt >= (base.updatedAt || 0)) {
          base = parsed;
        }
      }
    } catch {
      // fallback to ref
    }

    const draft = recipe(base);
    if (draft === base) return;

    const next = {
      ...draft,
      updatedAt: Date.now(),
    };

    hospitalStateRef.current = next;

    try {
      window.localStorage.setItem(HOSPITAL_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore quota errors
    }

    try {
      channelRef.current?.postMessage({
        type: 'HOSPITAL_STATE_SYNC',
        sender: tabIdRef.current,
        payload: next,
      });
    } catch {
      // ignore
    }

    setHospitalState(next);
  }, []);

  // Pick fastest department room for a category (e.g. 'med' chooses shorter wait between med_1 and med_2)
  const pickBestDepartmentForCategory = useCallback((categoryId, stateSnapshot) => {
    const cat = PATIENT_CATEGORIES.find((c) => c.id === categoryId);
    if (!cat) return 'med_1';
    if (cat.departmentIds.length === 1) return cat.departmentIds[0];

    let bestDeptId = cat.departmentIds[0];
    let bestScore = Infinity;

    for (const deptId of cat.departmentIds) {
      const waitingCount = stateSnapshot.patients.filter(
        (p) => p.departmentId === deptId && p.status === 'waiting'
      ).length;
      const servingCount = stateSnapshot.patients.some(
        (p) => p.departmentId === deptId && p.status === 'serving'
      )
        ? 1
        : 0;
      const avg = computeAvgConsultMinutes(deptId, stateSnapshot.departmentsState);
      const delay = computeDoctorDelayMinutes(deptId, stateSnapshot.departmentsState, stateSnapshot.simMinutes);
      const est = (waitingCount + servingCount) * avg + delay;
      if (est < bestScore) {
        bestScore = est;
        bestDeptId = deptId;
      }
    }
    return bestDeptId;
  }, []);

  // Register a new patient (from Patient screen or Staff Counter)
  const registerPatient = useCallback(
    ({ firstName, age, gender, mobile = '', categoryId = 'med', explicitDepartmentId = null, saveToPhone = true }) => {
      const cleanFirst =
        String(firstName || 'Visitor')
          .trim()
          .split(/\s+/)[0]
          .slice(0, 28) || 'Visitor';

      let createdTicket = null;

      commitHospitalState((base) => {
        const departmentId =
          explicitDepartmentId && DEPARTMENT_MAP[explicitDepartmentId]
            ? explicitDepartmentId
            : pickBestDepartmentForCategory(categoryId, base);
        const dept = DEPARTMENT_MAP[departmentId];
        const prefix = dept.tokenPrefix;
        const nextNum = (base.counters[prefix] || 0) + 1;
        const padded = String(nextNum).padStart(3, '0');
        const token = `${prefix}-${padded}`;

        const anyoneServing = base.patients.some(
          (p) => p.departmentId === departmentId && p.status === 'serving'
        );
        const anyoneWaiting = base.patients.some(
          (p) => p.departmentId === departmentId && p.status === 'waiting'
        );
        const initialStatus = !anyoneServing && !anyoneWaiting ? 'serving' : 'waiting';

        createdTicket = {
          token,
          firstName: cleanFirst,
          age: Number(age) || 40,
          gender: gender || 'female',
          mobile: String(mobile || '').trim(),
          departmentId,
          status: initialStatus,
          createdAt: Date.now(),
          calledAt: initialStatus === 'serving' ? Date.now() : null,
        };

        return {
          ...base,
          counters: {
            ...base.counters,
            [prefix]: nextNum,
          },
          patients: [...base.patients, createdTicket],
          lastCalledEvent:
            initialStatus === 'serving'
              ? {
                  id: `call-${Date.now()}-${token}`,
                  token,
                  roomNumber: dept.roomNumber,
                  departmentId,
                  timestamp: Date.now(),
                }
              : base.lastCalledEvent,
        };
      });

      if (saveToPhone && createdTicket) {
        updatePrefs((prev) => ({
          myTokens: [createdTicket.token, ...(prev.myTokens || []).filter((t) => t !== createdTicket.token)].slice(
            0,
            8
          ),
        }));
      }

      return createdTicket;
    },
    [commitHospitalState, pickBestDepartmentForCategory, updatePrefs]
  );

  // Staff Action: Call Next patient in a department room
  const callNextInDepartment = useCallback(
    (departmentId) => {
      commitHospitalState((base) => {
        const dept = DEPARTMENT_MAP[departmentId];
        if (!dept) return base;

        const ds = base.departmentsState[departmentId] || {
          doctorStatus: 'available',
          breakUntil: '11:30',
          lateMinutes: 0,
          recentDurations: [dept.sampleAvgMinutes],
          servingStartedSimMin: base.simMinutes,
        };

        const currentServing = base.patients.find(
          (p) => p.departmentId === departmentId && p.status === 'serving'
        );
        const waitingQueue = base.patients.filter(
          (p) => p.departmentId === departmentId && p.status === 'waiting'
        );
        const nextPatient = waitingQueue[0] || null;

        // Record completed consultation duration in rolling window of last 10 patients
        let updatedRecent = [...(ds.recentDurations || [dept.sampleAvgMinutes])];
        if (currentServing) {
          const simElapsed = base.simMinutes - (ds.servingStartedSimMin ?? base.simMinutes);
          const wallElapsed = currentServing.calledAt
            ? (Date.now() - currentServing.calledAt) / 60000
            : 0;
          const effectiveElapsed = Math.max(simElapsed, wallElapsed);
          const recordedMins =
            effectiveElapsed >= 1 && effectiveElapsed <= 30
              ? Math.round(effectiveElapsed * 10) / 10
              : dept.sampleAvgMinutes;
          updatedRecent = [...updatedRecent, recordedMins].slice(-10);
        }

        const updatedPatients = base.patients.map((p) => {
          if (currentServing && p.token === currentServing.token) {
            return { ...p, status: 'completed' };
          }
          if (nextPatient && p.token === nextPatient.token) {
            return { ...p, status: 'serving', calledAt: Date.now() };
          }
          return p;
        });

        return {
          ...base,
          patients: updatedPatients,
          departmentsState: {
            ...base.departmentsState,
            [departmentId]: {
              ...ds,
              doctorStatus: ds.doctorStatus === 'break' ? 'available' : ds.doctorStatus,
              recentDurations: updatedRecent,
              servingStartedSimMin: base.simMinutes,
            },
          },
          lastCalledEvent: nextPatient
            ? {
                id: `call-${Date.now()}-${nextPatient.token}`,
                token: nextPatient.token,
                roomNumber: dept.roomNumber,
                departmentId,
                timestamp: Date.now(),
              }
            : base.lastCalledEvent,
        };
      });
    },
    [commitHospitalState]
  );

  // Staff Action: Mark current serving patient as No-Show (and automatically call next if waiting)
  const markNoShow = useCallback(
    (departmentId) => {
      commitHospitalState((base) => {
        const dept = DEPARTMENT_MAP[departmentId];
        if (!dept) return base;
        const currentServing = base.patients.find(
          (p) => p.departmentId === departmentId && p.status === 'serving'
        );
        const waitingQueue = base.patients.filter(
          (p) => p.departmentId === departmentId && p.status === 'waiting'
        );
        if (!currentServing && waitingQueue.length === 0) return base;

        const targetNoShow = currentServing || waitingQueue[0];
        const nextToServe = currentServing ? waitingQueue[0] : waitingQueue[1];

        const updatedPatients = base.patients.map((p) => {
          if (p.token === targetNoShow.token) {
            return { ...p, status: 'noshow' };
          }
          if (nextToServe && p.token === nextToServe.token) {
            return { ...p, status: 'serving', calledAt: Date.now() };
          }
          return p;
        });

        return {
          ...base,
          patients: updatedPatients,
          lastCalledEvent: nextToServe
            ? {
                id: `call-${Date.now()}-${nextToServe.token}`,
                token: nextToServe.token,
                roomNumber: dept.roomNumber,
                departmentId,
                timestamp: Date.now(),
              }
            : base.lastCalledEvent,
        };
      });
    },
    [commitHospitalState]
  );

  // Staff Action: Send current serving (or top waiting) patient to the end of that department's queue
  const sendPatientToEnd = useCallback(
    (departmentId, specificToken = null) => {
      commitHospitalState((base) => {
        const dept = DEPARTMENT_MAP[departmentId];
        if (!dept) return base;
        const deptPatients = base.patients.filter((p) => p.departmentId === departmentId);
        const currentServing = deptPatients.find((p) => p.status === 'serving');
        const waitingQueue = deptPatients.filter((p) => p.status === 'waiting');

        const targetToken =
          specificToken || (currentServing ? currentServing.token : waitingQueue[0]?.token);
        if (!targetToken) return base;

        const targetObj = base.patients.find((p) => p.token === targetToken);
        if (!targetObj) return base;

        const wasServing = targetObj.status === 'serving';
        const remaining = base.patients.filter((p) => p.token !== targetToken);
        const nextWaiting = remaining.find(
          (p) => p.departmentId === departmentId && p.status === 'waiting'
        );

        const promotedRemaining = remaining.map((p) => {
          if (wasServing && nextWaiting && p.token === nextWaiting.token) {
            return { ...p, status: 'serving', calledAt: Date.now() };
          }
          return p;
        });

        const movedToEnd = {
          ...targetObj,
          status: !wasServing || nextWaiting ? 'waiting' : 'serving',
          createdAt: Date.now(),
        };

        return {
          ...base,
          patients: [...promotedRemaining, movedToEnd],
          lastCalledEvent:
            wasServing && nextWaiting
              ? {
                  id: `call-${Date.now()}-${nextWaiting.token}`,
                  token: nextWaiting.token,
                  roomNumber: dept.roomNumber,
                  departmentId,
                  timestamp: Date.now(),
                }
              : base.lastCalledEvent,
        };
      });
    },
    [commitHospitalState]
  );

  // Staff Action: Move a patient to another department
  const movePatientToDepartment = useCallback(
    (token, targetDepartmentId) => {
      commitHospitalState((base) => {
        const targetDept = DEPARTMENT_MAP[targetDepartmentId];
        if (!targetDept) return base;

        const patient = base.patients.find((p) => p.token === token);
        if (!patient || patient.departmentId === targetDepartmentId) return base;

        const oldDeptId = patient.departmentId;
        const oldDept = DEPARTMENT_MAP[oldDeptId];
        const wasServing = patient.status === 'serving';

        const withoutTarget = base.patients.filter((p) => p.token !== token);
        const oldNextWaiting = withoutTarget.find(
          (p) => p.departmentId === oldDeptId && p.status === 'waiting'
        );

        const targetHasServing = withoutTarget.some(
          (p) => p.departmentId === targetDepartmentId && p.status === 'serving'
        );
        const targetHasWaiting = withoutTarget.some(
          (p) => p.departmentId === targetDepartmentId && p.status === 'waiting'
        );
        const newStatus = !targetHasServing && !targetHasWaiting ? 'serving' : 'waiting';

        const updatedRest = withoutTarget.map((p) => {
          if (wasServing && oldNextWaiting && p.token === oldNextWaiting.token) {
            return { ...p, status: 'serving', calledAt: Date.now() };
          }
          return p;
        });

        const updatedPatient = {
          ...patient,
          departmentId: targetDepartmentId,
          movedFromDeptId: oldDeptId,
          status: newStatus,
          calledAt: newStatus === 'serving' ? Date.now() : patient.calledAt,
        };

        let nextEvent = base.lastCalledEvent;
        if (newStatus === 'serving') {
          nextEvent = {
            id: `call-${Date.now()}-${patient.token}`,
            token: patient.token,
            roomNumber: targetDept.roomNumber,
            departmentId: targetDepartmentId,
            timestamp: Date.now(),
          };
        } else if (wasServing && oldNextWaiting && oldDept) {
          nextEvent = {
            id: `call-${Date.now()}-${oldNextWaiting.token}`,
            token: oldNextWaiting.token,
            roomNumber: oldDept.roomNumber,
            departmentId: oldDeptId,
            timestamp: Date.now(),
          };
        }

        return {
          ...base,
          patients: [...updatedRest, updatedPatient],
          lastCalledEvent: nextEvent,
        };
      });
    },
    [commitHospitalState]
  );

  // Staff Action: Update Doctor Status for a room
  const setDoctorStatus = useCallback(
    (departmentId, { status, breakUntil, lateMinutes }) => {
      commitHospitalState((base) => {
        const prevDs = base.departmentsState[departmentId] || {};
        return {
          ...base,
          departmentsState: {
            ...base.departmentsState,
            [departmentId]: {
              ...prevDs,
              doctorStatus: status ?? prevDs.doctorStatus ?? 'available',
              breakUntil: breakUntil !== undefined ? breakUntil : prevDs.breakUntil || '11:30',
              lateMinutes: lateMinutes !== undefined ? Number(lateMinutes) : prevDs.lateMinutes || 15,
            },
          },
        };
      });
    },
    [commitHospitalState]
  );

  // Patient/Helper Action: Raise an Urgent Help Flag (appears at top of Staff Dashboard within <1s)
  const raiseUrgentFlag = useCallback(
    ({ placeId = 'entrance', token = null, firstName = '' } = {}) => {
      let createdFlag = null;
      commitHospitalState((base) => {
        createdFlag = {
          id: `flag-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          createdAt: Date.now(),
          clockStr: formatSimClock(base.simMinutes),
          placeId: placeId || 'entrance',
          token: token || null,
          firstName: firstName || '',
          seen: false,
        };
        return {
          ...base,
          urgentFlags: [createdFlag, ...(base.urgentFlags || [])],
        };
      });
      return createdFlag;
    },
    [commitHospitalState]
  );

  // Staff Action: Mark Urgent Flag as seen
  const markUrgentFlagSeen = useCallback(
    (flagId) => {
      commitHospitalState((base) => ({
        ...base,
        urgentFlags: (base.urgentFlags || []).map((f) =>
          f.id === flagId ? { ...f, seen: true, seenAt: Date.now() } : f
        ),
      }));
    },
    [commitHospitalState]
  );

  // Demo Control 1: Add 20 Sample Patients
  const addTwentySamplePatients = useCallback(() => {
    commitHospitalState((base) => {
      const nextCounters = { ...base.counters };
      const addedPatients = [];

      // Create working snapshot of patients so load balancing between Room 1 and Room 2 stays even
      const workingPatients = [...base.patients];
      for (const sample of DEMO_SAMPLE_BATCH_20) {
        const tempSnapshot = { ...base, patients: workingPatients };
        const deptId = pickBestDepartmentForCategory(sample.categoryId, tempSnapshot);
        const dept = DEPARTMENT_MAP[deptId];
        const prefix = dept.tokenPrefix;
        nextCounters[prefix] = (nextCounters[prefix] || 0) + 1;
        const token = `${prefix}-${String(nextCounters[prefix]).padStart(3, '0')}`;

        const hasServing = workingPatients.some(
          (p) => p.departmentId === deptId && p.status === 'serving'
        );
        const hasWaiting = workingPatients.some(
          (p) => p.departmentId === deptId && p.status === 'waiting'
        );
        const status = !hasServing && !hasWaiting ? 'serving' : 'waiting';

        const newP = {
          token,
          firstName: sample.firstName,
          age: sample.age,
          gender: sample.gender,
          mobile: '',
          departmentId: deptId,
          status,
          createdAt: Date.now(),
          calledAt: status === 'serving' ? Date.now() : null,
        };
        workingPatients.push(newP);
        addedPatients.push(newP);
      }

      return {
        ...base,
        counters: nextCounters,
        patients: workingPatients,
      };
    });
  }, [commitHospitalState, pickBestDepartmentForCategory]);

  // Demo Control 2: Toggle 10x Speed Simulation
  const toggleSpeed10x = useCallback(() => {
    commitHospitalState((base) => ({
      ...base,
      speed10x: !base.speed10x,
      lastTickAt: Date.now(),
    }));
  }, [commitHospitalState]);

  // Demo Control 3: Reset Everything
  const resetHospitalState = useCallback(() => {
    const fresh = buildInitialHospitalState();
    try {
      window.localStorage.setItem(HOSPITAL_STORAGE_KEY, JSON.stringify(fresh));
      channelRef.current?.postMessage({
        type: 'HOSPITAL_STATE_SYNC',
        sender: tabIdRef.current,
        payload: fresh,
      });
    } catch {
      // ignore
    }
    setHospitalState(fresh);
    updatePrefs({ myTokens: [] });
  }, [updatePrefs]);

  // Normal 1x wall-clock minute ticker when speed10x is OFF
  useEffect(() => {
    if (hospitalState.speed10x) return undefined;
    const minuteTimer = window.setInterval(() => {
      commitHospitalState((base) => {
        if (base.speed10x) return base;
        if (Date.now() - (base.lastTickAt || 0) < 58000) return base;
        return {
          ...base,
          simMinutes: base.simMinutes + 1,
          lastTickAt: Date.now(),
        };
      });
    }, 60000);
    return () => window.clearInterval(minuteTimer);
  }, [hospitalState.speed10x, commitHospitalState]);

  // 10x Speed background simulation ticker (advances hospital clock and calls next patients smoothly)
  useEffect(() => {
    if (!hospitalState.speed10x) return undefined;

    const timer = window.setInterval(() => {
      commitHospitalState((base) => {
        if (!base.speed10x) return base;
        // Prevent multiple open tabs from ticking faster than once per 1.6s
        if (Date.now() - (base.lastTickAt || 0) < 1550) {
          return base;
        }

        const nextSimMin = base.simMinutes + 3;
        // Pick active rooms that aren't on break and have waiting patients
        const eligibleDepts = DEPARTMENTS.filter((d) => {
          const ds = base.departmentsState[d.id];
          if (ds?.doctorStatus === 'break') return false;
          return base.patients.some((p) => p.departmentId === d.id && p.status === 'waiting');
        });

        if (eligibleDepts.length === 0) {
          return {
            ...base,
            simMinutes: nextSimMin,
            speed10x: false, // auto-pause once all queues finish
            lastTickAt: Date.now(),
          };
        }

        // Advance one room per tick in round-robin order so calls and announcements feel realistic
        const chosenIndex = Math.floor(nextSimMin / 3) % eligibleDepts.length;
        const chosenDept = eligibleDepts[chosenIndex];
        const ds = base.departmentsState[chosenDept.id] || {};
        const currentServing = base.patients.find(
          (p) => p.departmentId === chosenDept.id && p.status === 'serving'
        );
        const nextWaiting = base.patients.find(
          (p) => p.departmentId === chosenDept.id && p.status === 'waiting'
        );

        const nextRecent = [
          ...(ds.recentDurations || [chosenDept.sampleAvgMinutes]),
          chosenDept.sampleAvgMinutes,
        ].slice(-10);

        const updatedPatients = base.patients.map((p) => {
          if (currentServing && p.token === currentServing.token) {
            return { ...p, status: 'completed' };
          }
          if (nextWaiting && p.token === nextWaiting.token) {
            return { ...p, status: 'serving', calledAt: Date.now() };
          }
          return p;
        });

        return {
          ...base,
          simMinutes: nextSimMin,
          lastTickAt: Date.now(),
          patients: updatedPatients,
          departmentsState: {
            ...base.departmentsState,
            [chosenDept.id]: {
              ...ds,
              recentDurations: nextRecent,
              servingStartedSimMin: nextSimMin,
            },
          },
          lastCalledEvent: nextWaiting
            ? {
                id: `call-${Date.now()}-${nextWaiting.token}`,
                token: nextWaiting.token,
                roomNumber: chosenDept.roomNumber,
                departmentId: chosenDept.id,
                timestamp: Date.now(),
              }
            : base.lastCalledEvent,
        };
      });
    }, 1800);

    return () => window.clearInterval(timer);
  }, [hospitalState.speed10x, commitHospitalState]);

  const dict = DICTIONARIES[prefs.lang] || DICTIONARIES.en;

  // Derived helper: Get detailed metrics for a department
  const getDepartmentQueueSummary = useCallback(
    (deptId) => {
      const dept = DEPARTMENT_MAP[deptId];
      const ds = hospitalState.departmentsState[deptId] || {
        doctorStatus: 'available',
        breakUntil: '11:30',
        lateMinutes: 0,
        recentDurations: [dept?.sampleAvgMinutes || 5],
      };
      const servingPatient =
        hospitalState.patients.find((p) => p.departmentId === deptId && p.status === 'serving') ||
        null;
      const waitingPatients = hospitalState.patients.filter(
        (p) => p.departmentId === deptId && p.status === 'waiting'
      );
      const avgConsult = computeAvgConsultMinutes(deptId, hospitalState.departmentsState);
      const doctorDelay = computeDoctorDelayMinutes(
        deptId,
        hospitalState.departmentsState,
        hospitalState.simMinutes
      );
      const peopleAheadForNew = waitingPatients.length + (servingPatient ? 1 : 0);
      const estimatedWaitForNew = computeRoundedWaitMinutes(
        peopleAheadForNew,
        avgConsult,
        doctorDelay
      );

      return {
        dept,
        doctorStatus: ds.doctorStatus,
        breakUntil: ds.breakUntil,
        lateMinutes: ds.lateMinutes,
        servingPatient,
        waitingPatients,
        waitingCount: waitingPatients.length,
        avgConsult: Math.round(avgConsult * 10) / 10,
        doctorDelay,
        estimatedWaitForNew,
      };
    },
    [hospitalState]
  );

  // Derived helper: Get live queue details for a specific patient token
  const getPatientDetails = useCallback(
    (rawToken) => {
      if (!rawToken) return null;
      const normalized = String(rawToken).trim().toUpperCase();
      // Support typing MED042 or MED-42 as MED-042
      const matchFlex = normalized.match(/^([A-Z]{3})-?(\d{1,4})$/);
      const formattedCandidate = matchFlex
        ? `${matchFlex[1]}-${String(Number(matchFlex[2])).padStart(3, '0')}`
        : normalized;

      let patient = hospitalState.patients.find(
        (p) => p.token.toUpperCase() === normalized || p.token.toUpperCase() === formattedCandidate
      );
      // Also support bare number entry (e.g. "041" or "41") when unambiguous among active tickets
      if (!patient && /^\d{1,4}$/.test(normalized)) {
        const suffix = `-${String(Number(normalized)).padStart(3, '0')}`;
        const matches = hospitalState.patients.filter((p) => p.token.toUpperCase().endsWith(suffix));
        if (matches.length === 1) {
          patient = matches[0];
        }
      }
      if (!patient) return null;

      const summary = getDepartmentQueueSummary(patient.departmentId);
      const waitingIdx = summary.waitingPatients.findIndex((p) => p.token === patient.token);

      let peopleAhead = 0;
      if (patient.status === 'waiting') {
        peopleAhead = Math.max(0, waitingIdx) + (summary.servingPatient ? 1 : 0);
      }

      const estimatedWaitMins =
        patient.status === 'waiting'
          ? computeRoundedWaitMinutes(peopleAhead, summary.avgConsult, summary.doctorDelay)
          : 0;

      const aheadText =
        peopleAhead === 0
          ? dict.common.peopleAheadZero
          : peopleAhead === 1
          ? dict.common.peopleAheadOne
          : formatStr(dict.common.peopleAheadMany, { count: peopleAhead });

      const waitText =
        estimatedWaitMins <= 0
          ? dict.common.lessThanFive
          : formatStr(dict.common.aboutWait, { mins: estimatedWaitMins });

      return {
        patient,
        dept: summary.dept,
        summary,
        peopleAhead,
        estimatedWaitMins,
        aheadText,
        waitText,
      };
    },
    [hospitalState.patients, getDepartmentQueueSummary, dict]
  );

  // Derived helper: Waiting area overcrowding statuses
  const waitingAreaStats = useMemo(() => {
    return WAITING_AREAS.map((area) => {
      let waiting = 0;
      if (area.id === 'ground_lobby') {
        // Approximate walk-ins near registration proportional to total hospital activity
        const totalWaiting = hospitalState.patients.filter((p) => p.status === 'waiting').length;
        waiting = Math.max(3, Math.round(totalWaiting * 0.28));
      } else {
        waiting = hospitalState.patients.filter(
          (p) => area.departmentIds.includes(p.departmentId) && p.status === 'waiting'
        ).length;
      }
      const ratio = waiting / area.seats;
      let level = 'calm'; // < 0.7
      if (ratio >= 1.0) level = 'full';
      else if (ratio >= 0.7) level = 'busy';

      return {
        ...area,
        waiting,
        ratio,
        level,
      };
    });
  }, [hospitalState.patients]);

  const unseenUrgentFlags = useMemo(
    () => (hospitalState.urgentFlags || []).filter((f) => !f.seen),
    [hospitalState.urgentFlags]
  );

  const activeSavedTokens = useMemo(() => {
    const existingSet = new Set(hospitalState.patients.map((p) => p.token));
    return (prefs.myTokens || []).filter((t) => existingSet.has(t));
  }, [prefs.myTokens, hospitalState.patients]);

  const value = useMemo(
    () => ({
      hospitalState,
      simClock: formatSimClock(hospitalState.simMinutes),
      prefs,
      dict,
      lang: prefs.lang,
      updatePrefs,
      registerPatient,
      callNextInDepartment,
      markNoShow,
      sendPatientToEnd,
      movePatientToDepartment,
      setDoctorStatus,
      raiseUrgentFlag,
      markUrgentFlagSeen,
      addTwentySamplePatients,
      toggleSpeed10x,
      resetHospitalState,
      getDepartmentQueueSummary,
      getPatientDetails,
      waitingAreaStats,
      unseenUrgentFlags,
      activeSavedTokens,
    }),
    [
      hospitalState,
      prefs,
      dict,
      updatePrefs,
      registerPatient,
      callNextInDepartment,
      markNoShow,
      sendPatientToEnd,
      movePatientToDepartment,
      setDoctorStatus,
      raiseUrgentFlag,
      markUrgentFlagSeen,
      addTwentySamplePatients,
      toggleSpeed10x,
      resetHospitalState,
      getDepartmentQueueSummary,
      getPatientDetails,
      waitingAreaStats,
      unseenUrgentFlags,
      activeSavedTokens,
    ]
  );

  return <HospitalContext.Provider value={value}>{children}</HospitalContext.Provider>;
}

export function useHospital() {
  const ctx = useContext(HospitalContext);
  if (!ctx) {
    throw new Error('useHospital must be used inside HospitalProvider');
  }
  return ctx;
}
