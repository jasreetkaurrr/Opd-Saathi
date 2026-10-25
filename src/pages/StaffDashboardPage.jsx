import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppShell } from '../components/AppShell.jsx';
import { Icon } from '../components/Icons.jsx';
import { DEPARTMENTS } from '../data/departments.js';
import { useHospital } from '../context/HospitalContext.jsx';
import { formatStr } from '../i18n/index.js';
import { playUrgentStaffAlarm, unlockAudio } from '../utils/sound.js';

export function StaffDashboardPage() {
  const {
    dict,
    lang,
    hospitalState,
    simClock,
    unseenUrgentFlags,
    waitingAreaStats,
    getDepartmentQueueSummary,
    callNextInDepartment,
    markNoShow,
    sendPatientToEnd,
    movePatientToDepartment,
    setDoctorStatus,
    markUrgentFlagSeen,
    addTwentySamplePatients,
    toggleSpeed10x,
    resetHospitalState,
  } = useHospital();

  const st = dict.staff;

  const [activeTab, setActiveTab] = useState('queues'); // 'queues' | 'doctors' | 'areas'
  const [moveModalDeptId, setMoveModalDeptId] = useState(null);
  const [selectedTokenToMove, setSelectedTokenToMove] = useState('');
  const [targetMoveDeptId, setTargetMoveDeptId] = useState('med_1');

  useEffect(() => {
    if (unseenUrgentFlags.length === 0) return undefined;
    window.scrollTo(0, 0);
    playUrgentStaffAlarm();
    const interval = window.setInterval(() => {
      playUrgentStaffAlarm();
    }, 3400);
    return () => window.clearInterval(interval);
  }, [unseenUrgentFlags.length]);

  const openMoveModal = (deptId) => {
    const sum = getDepartmentQueueSummary(deptId);
    const candidates = [
      ...(sum.servingPatient ? [sum.servingPatient] : []),
      ...sum.waitingPatients,
    ];
    if (candidates.length === 0) return;
    setMoveModalDeptId(deptId);
    setSelectedTokenToMove(candidates[0].token);
    const otherDept = DEPARTMENTS.find((d) => d.id !== deptId)?.id || 'med_1';
    setTargetMoveDeptId(otherDept);
  };

  const handleConfirmMove = (e) => {
    e.preventDefault();
    if (selectedTokenToMove && targetMoveDeptId) {
      movePatientToDepartment(selectedTokenToMove, targetMoveDeptId);
    }
    setMoveModalDeptId(null);
  };

  const moveCandidates = moveModalDeptId
    ? (() => {
        const s = getDepartmentQueueSummary(moveModalDeptId);
        return [...(s.servingPatient ? [s.servingPatient] : []), ...s.waitingPatients];
      })()
    : [];

  return (
    <AppShell hideFirstVisitModal customTitle={st.title}>
      <div onClick={unlockAudio} className="space-y-5">
        {/* ==================== STICKY PINNED RED URGENT BANNER (Matches Screen 12 of Reference Design) ==================== */}
        {unseenUrgentFlags.length > 0 && (
          <section
            role="alert"
            aria-live="assertive"
            className="sticky top-[134px] z-30 rounded-2xl bg-urgent text-white p-4 sm:p-5 shadow-xl space-y-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-white text-urgent flex items-center justify-center animate-bounce shrink-0">
                  <Icon name="urgent" className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold uppercase tracking-wide">
                    {formatStr(st.urgentSectionTitle, { count: unseenUrgentFlags.length })}
                  </h2>
                  <p className="text-xs sm:text-sm font-medium text-white/90 flex items-center gap-1.5">
                    <Icon name="speaker" className="w-4 h-4" />
                    <span>{st.urgentSoundActive}</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {unseenUrgentFlags.map((flag) => (
                <div
                  key={flag.id}
                  className="rounded-xl bg-white/15 border border-white/30 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-0.5">
                    <p className="font-extrabold text-base text-white">
                      {formatStr(st.urgentLocation, {
                        place: dict.places[flag.placeId]?.name || flag.placeId,
                      })}{' '}
                      • {flag.clockStr}
                    </p>
                    <p className="text-sm font-medium text-white/90">
                      {flag.token
                        ? `${formatStr(st.urgentToken, { token: flag.token })}${
                            flag.firstName ? ` (${flag.firstName})` : ''
                          }`
                        : st.urgentWalkIn}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => markUrgentFlagSeen(flag.id)}
                    className="tactile-btn rounded-xl bg-white text-urgent-dark border-white px-4 py-2 font-extrabold text-sm flex items-center justify-center gap-1.5 shrink-0 hc-primary"
                  >
                    <Icon name="check" className="w-4 h-4" />
                    <span>{st.markSeenBtn}</span>
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ==================== STAFF DASHBOARD HEADER + DEMO CONTROLS + TABS (Matches Screen 12) ==================== */}
        <section className="calm-card hc-card rounded-3xl p-4 sm:p-6 space-y-4">
          {/* Header Row */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-civic-light text-civic flex items-center justify-center shrink-0">
                <Icon name="building" className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-ink leading-tight">
                  {st.title}
                </h1>
                <p className="text-xs sm:text-sm font-medium text-ink-muted hc-muted">
                  {st.noLoginSub}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-xl bg-paper-warm border border-paper-border px-3 py-1.5 font-mono font-bold text-sm text-ink hc-card">
                {formatStr(st.hospitalClock, { time: simClock })}
              </span>
              <Link
                to="/staff/counter"
                className="tactile-btn rounded-xl bg-paper-card hover:bg-civic-light text-ink border-paper-border px-3 py-2 font-bold text-xs sm:text-sm flex items-center gap-1.5 hc-card"
              >
                <Icon name="slip" className="w-4 h-4 text-civic-mid" />
                <span>{st.openCounterBtn}</span>
              </Link>
              <Link
                to="/board"
                target="_blank"
                rel="noopener noreferrer"
                className="tactile-btn rounded-xl bg-civic hover:bg-civic-dark text-white border-civic-dark px-3 py-2 font-bold text-xs sm:text-sm flex items-center gap-1.5 hc-primary"
              >
                <Icon name="expand" className="w-4 h-4" />
                <span>{st.openBoardBtn}</span>
              </Link>
            </div>
          </div>

          {/* Demo Controls Box matching top of Screen 12 */}
          <div className="rounded-2xl bg-paper/80 border border-paper-border p-3.5 space-y-2.5 hc-card">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-ink-muted hc-muted">
                {st.demoControlsTitle}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={addTwentySamplePatients}
                className="tactile-btn rounded-xl bg-white hover:bg-civic-light text-ink border-paper-strong px-3 py-2 font-extrabold text-sm flex items-center justify-center gap-1.5 hc-card"
              >
                <Icon name="users" className="w-4 h-4 text-civic-mid" />
                <span>{st.add20Btn}</span>
              </button>

              <button
                type="button"
                onClick={toggleSpeed10x}
                aria-pressed={hospitalState.speed10x}
                className={`tactile-btn rounded-xl px-3 py-2 font-extrabold text-sm flex items-center justify-center gap-1.5 ${
                  hospitalState.speed10x
                    ? 'bg-civic-mid text-white border-civic animate-pulse hc-primary'
                    : 'bg-white hover:bg-civic-light text-ink border-paper-strong hc-card'
                }`}
              >
                <Icon name="bolt" className="w-4 h-4" />
                <span>{hospitalState.speed10x ? st.speed10xOn : st.speed10xOff}</span>
              </button>

              <button
                type="button"
                onClick={resetHospitalState}
                className="tactile-btn rounded-xl bg-white hover:bg-coral-light text-coral-ink border-paper-strong px-3 py-2 font-extrabold text-sm flex items-center justify-center gap-1.5 hc-card"
              >
                <Icon name="refresh" className="w-4 h-4 text-urgent" />
                <span>{st.resetBtn}</span>
              </button>
            </div>
          </div>

          {/* 3 Clean Underline Tabs: Queues | Doctors | Waiting Areas */}
          <div className="grid grid-cols-3 border-b border-paper-border">
            {[
              { id: 'queues', label: st.tabQueues, icon: 'users' },
              { id: 'doctors', label: st.tabDoctors, icon: 'med' },
              { id: 'areas', label: st.tabWaitingAreas, icon: 'seats' },
            ].map((tb) => {
              const active = activeTab === tb.id;
              return (
                <button
                  key={tb.id}
                  type="button"
                  onClick={() => setActiveTab(tb.id)}
                  className={`tactile-btn border-0 border-b-3 shadow-none rounded-t-xl rounded-b-none px-2 py-2.5 font-extrabold text-xs sm:text-base flex items-center justify-center gap-1.5 ${
                    active
                      ? 'border-b-civic text-civic bg-civic-light/30'
                      : 'border-b-transparent text-ink-muted hc-muted'
                  }`}
                >
                  <Icon name={tb.icon} className="w-4 h-4" />
                  <span>{tb.label}</span>
                </button>
              );
            })}
          </div>

          {/* ---------- TAB 1: QUEUES SUMMARY TABLE (Matches Screen 12 Table) ---------- */}
          {activeTab === 'queues' && (
            <div className="overflow-x-auto -mx-2 px-2">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-paper-border text-xs font-extrabold uppercase text-ink-muted hc-muted whitespace-nowrap">
                    <th className="py-2.5 pr-2">{st.colDepartments}</th>
                    <th className="py-2.5 px-2">{st.colNow}</th>
                    <th className="py-2.5 px-2 text-center">{st.waitingCount}</th>
                    <th className="py-2.5 pl-2 text-right">{st.avgWait}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-paper-border text-sm">
                  {DEPARTMENTS.map((dept) => {
                    const sum = getDepartmentQueueSummary(dept.id);
                    return (
                      <tr key={`row-${dept.id}`} className="hover:bg-paper/60">
                        <td className="py-2.5 pr-2 font-bold text-ink">
                          <span className="block leading-snug">
                            {dict.departments[dept.id]?.shortName}
                          </span>
                          <span className="text-xs text-ink-muted hc-muted">
                            {formatStr(st.roomBadge, { room: dept.roomNumber })}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 font-mono font-extrabold text-civic">
                          {sum.servingPatient ? sum.servingPatient.token : '—'}
                        </td>
                        <td className="py-2.5 px-2 text-center font-mono font-bold text-ink">
                          {sum.waitingCount}
                        </td>
                        <td className="py-2.5 pl-2 text-right font-mono font-semibold text-ink-muted hc-muted">
                          {sum.estimatedWaitForNew <= 0 ? '5m' : `${sum.estimatedWaitForNew}m`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* ---------- TAB 2: DOCTORS STATUS CONTROLS ---------- */}
          {activeTab === 'doctors' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
              {DEPARTMENTS.map((dept) => {
                const sum = getDepartmentQueueSummary(dept.id);
                return (
                  <div
                    key={`doc-${dept.id}`}
                    className="rounded-2xl border border-paper-border bg-white p-4 space-y-3 hc-card"
                  >
                    <div>
                      <p className="text-xs font-extrabold uppercase text-civic-mid">
                        {formatStr(st.roomBadge, { room: dept.roomNumber })} •{' '}
                        {dict.departments[dept.id]?.shortName}
                      </p>
                      <p className="text-base font-extrabold text-ink mt-0.5">
                        {dept.doctor[lang] || dept.doctor.en}
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { id: 'available', label: st.docAvailable, icon: 'check' },
                        { id: 'break', label: st.docBreak, icon: 'clock' },
                        { id: 'late', label: st.docLate, icon: 'urgent' },
                      ].map((opt) => {
                        const active = sum.doctorStatus === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() =>
                              setDoctorStatus(dept.id, {
                                status: opt.id,
                                lateMinutes: opt.id === 'late' ? sum.lateMinutes || 15 : sum.lateMinutes,
                                breakUntil:
                                  opt.id === 'break' ? sum.breakUntil || '11:30' : sum.breakUntil,
                              })
                            }
                            className={`tactile-btn px-2 py-2 rounded-xl border font-extrabold text-xs flex flex-col items-center justify-center gap-1 text-center ${
                              active
                                ? opt.id === 'available'
                                  ? 'bg-civic text-white border-civic-dark hc-primary'
                                  : 'bg-ochre text-white border-ochre'
                                : 'bg-paper text-ink border-paper-border hc-card'
                            }`}
                          >
                            <Icon name={opt.icon} className="w-4 h-4" />
                            <span>{opt.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    {sum.doctorStatus === 'break' && (
                      <div className="flex items-center justify-between gap-2 bg-ochre-light rounded-xl px-3 py-2 border border-ochre-border hc-card">
                        <label
                          htmlFor={`break-time-${dept.id}`}
                          className="text-sm font-bold text-ink"
                        >
                          {st.breakUntilLabel}
                        </label>
                        <input
                          id={`break-time-${dept.id}`}
                          type="time"
                          value={sum.breakUntil || '11:30'}
                          onChange={(e) =>
                            setDoctorStatus(dept.id, { status: 'break', breakUntil: e.target.value })
                          }
                          className="min-h-[56px] px-3 py-1.5 rounded-lg border border-paper-strong bg-white font-mono font-bold text-sm text-ink"
                        />
                      </div>
                    )}

                    {sum.doctorStatus === 'late' && (
                      <div className="flex items-center justify-between gap-2 bg-ochre-light rounded-xl px-3 py-2 border border-ochre-border hc-card">
                        <label
                          htmlFor={`late-mins-${dept.id}`}
                          className="text-sm font-bold text-ink"
                        >
                          {st.lateByLabel}
                        </label>
                        <select
                          id={`late-mins-${dept.id}`}
                          value={sum.lateMinutes || 15}
                          onChange={(e) =>
                            setDoctorStatus(dept.id, {
                              status: 'late',
                              lateMinutes: Number(e.target.value),
                            })
                          }
                          className="min-h-[56px] px-3 py-1.5 rounded-lg border border-paper-strong bg-white font-mono font-bold text-sm text-ink"
                        >
                          {[10, 15, 20, 30, 45, 60].map((m) => (
                            <option key={m} value={m}>
                              {m} {dict.common.minsShort}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ---------- TAB 3: WAITING AREAS OVERCROWDING MONITOR ---------- */}
          {activeTab === 'areas' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
              {waitingAreaStats.map((area) => {
                const badgeStyles =
                  area.level === 'full'
                    ? 'bg-coral-light border-coral-badge text-coral-ink'
                    : area.level === 'busy'
                    ? 'bg-ochre-light border-ochre-border text-ink'
                    : 'bg-civic-light border-civic-border text-civic';

                const barColor =
                  area.level === 'full'
                    ? 'bg-urgent'
                    : area.level === 'busy'
                    ? 'bg-ochre'
                    : 'bg-civic-mid';

                const statusText =
                  area.level === 'full'
                    ? st.crowdFull
                    : area.level === 'busy'
                    ? st.crowdBusy
                    : st.crowdCalm;

                const statusIcon =
                  area.level === 'full' ? 'urgent' : area.level === 'busy' ? 'clock' : 'check';

                return (
                  <div
                    key={area.id}
                    className={`rounded-2xl border p-4 space-y-2.5 hc-card ${badgeStyles}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-extrabold text-base text-ink leading-snug">
                        {dict.waitingAreas[area.id]}
                      </h3>
                      <Icon name={statusIcon} className="w-5 h-5 shrink-0" />
                    </div>
                    <p className="font-mono text-sm font-extrabold text-ink">
                      {formatStr(st.seatsUsed, { waiting: area.waiting, seats: area.seats })}
                    </p>
                    <div className="w-full h-2.5 bg-white/80 rounded-full overflow-hidden border border-ink/15">
                      <div
                        className={`h-full ${barColor} transition-all duration-300`}
                        style={{ width: `${Math.min(100, Math.round(area.ratio * 100))}%` }}
                      />
                    </div>
                    <p className="text-xs sm:text-sm font-extrabold">{statusText}</p>
                  </div>
                );
              })}
            </div>
          )}

          <p className="text-xs font-medium text-ink-muted hc-muted flex items-center gap-1.5 pt-1">
            <Icon name="help" className="w-4 h-4 text-civic-mid shrink-0" />
            <span>{st.loginNotice}</span>
          </p>
        </section>

        {/* ==================== INTERACTIVE ROOM QUEUE CONTROL CARDS (Call Next, No-Show, End, Move, Doctor Status) ==================== */}
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {DEPARTMENTS.map((dept) => {
            const sum = getDepartmentQueueSummary(dept.id);
            const avgWaitStr =
              sum.estimatedWaitForNew <= 0
                ? dict.common.lessThanFive
                : formatStr(dict.common.aboutWait, { mins: sum.estimatedWaitForNew });

            return (
              <article
                key={dept.id}
                className="calm-card hc-card rounded-3xl p-4 sm:p-5 flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="inline-block px-2.5 py-0.5 rounded-lg bg-civic-light text-civic font-extrabold text-xs">
                        {formatStr(st.roomBadge, { room: dept.roomNumber })} •{' '}
                        {dict.floors[`short${dept.floor}`]}
                      </span>
                      <h2 className="text-lg sm:text-xl font-extrabold text-ink mt-1">
                        {dict.departments[dept.id]?.name}
                      </h2>
                      <p className="text-xs sm:text-sm font-medium text-ink-muted hc-muted">
                        {dept.doctor[lang] || dept.doctor.en} •{' '}
                        {formatStr(st.avgConsult, { mins: sum.avgConsult })}
                      </p>
                    </div>
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-2xl border border-civic-border bg-civic-light/55 p-2.5 text-center hc-card">
                      <p className="text-xs font-bold text-ink-muted hc-muted">{st.servingNow}</p>
                      <p className="font-mono text-lg sm:text-xl font-black text-ink mt-0.5">
                        {sum.servingPatient ? sum.servingPatient.token : st.noOneServing}
                      </p>
                      {sum.servingPatient && (
                        <p className="text-xs font-semibold text-civic truncate">
                          {sum.servingPatient.firstName}
                        </p>
                      )}
                    </div>

                    <div className="rounded-2xl border border-paper-border bg-paper/75 p-2.5 text-center hc-card">
                      <p className="text-xs font-bold text-ink-muted hc-muted">{st.waitingCount}</p>
                      <p className="font-mono text-xl font-black text-ink mt-0.5">
                        {sum.waitingCount}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-paper-border bg-paper/75 p-2.5 text-center hc-card">
                      <p className="text-xs font-bold text-ink-muted hc-muted">{st.avgWait}</p>
                      <p className="text-xs sm:text-sm font-extrabold text-ink mt-1 leading-snug">
                        {avgWaitStr}
                      </p>
                    </div>
                  </div>

                  {/* Quick Doctor Status Pills right on card too */}
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'available', label: st.docAvailable, icon: 'check' },
                      { id: 'break', label: st.docBreak, icon: 'clock' },
                      { id: 'late', label: st.docLate, icon: 'urgent' },
                    ].map((opt) => {
                      const active = sum.doctorStatus === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() =>
                            setDoctorStatus(dept.id, {
                              status: opt.id,
                              lateMinutes: opt.id === 'late' ? sum.lateMinutes || 15 : sum.lateMinutes,
                              breakUntil:
                                opt.id === 'break' ? sum.breakUntil || '11:30' : sum.breakUntil,
                            })
                          }
                          className={`tactile-btn px-2 py-1.5 rounded-xl border font-bold text-xs flex flex-col sm:flex-row items-center justify-center gap-1 text-center ${
                            active
                              ? opt.id === 'available'
                                ? 'bg-civic text-white border-civic-dark hc-primary'
                                : 'bg-ochre text-white border-ochre'
                              : 'bg-white text-ink border-paper-border hc-card'
                          }`}
                        >
                          <Icon name={opt.icon} className="w-3.5 h-3.5" />
                          <span>{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Up Next Preview */}
                  <div className="text-xs sm:text-sm text-ink-muted hc-muted flex flex-wrap items-center gap-1.5">
                    <span className="font-bold text-ink">{st.nextUpQueue}</span>
                    {sum.waitingPatients.length === 0 ? (
                      <span>{st.queueEmpty}</span>
                    ) : (
                      sum.waitingPatients.slice(0, 4).map((p) => (
                        <span
                          key={p.token}
                          className="px-2 py-0.5 rounded-md bg-paper-warm border border-paper-border font-mono font-bold text-ink"
                        >
                          {p.token}
                        </span>
                      ))
                    )}
                  </div>
                </div>

                {/* 4 Staff Queue Actions: Call Next, No-Show, Send to End, Move Dept */}
                <div className="space-y-2 pt-2 border-t border-paper-border">
                  <button
                    type="button"
                    disabled={sum.waitingCount === 0 && !sum.servingPatient}
                    onClick={() => callNextInDepartment(dept.id)}
                    className="tactile-btn w-full rounded-2xl bg-civic hover:bg-civic-dark disabled:opacity-45 text-white border-civic-dark px-4 py-3 font-extrabold text-base flex items-center justify-center gap-2 hc-primary"
                  >
                    <Icon name="speaker" className="w-5 h-5" />
                    <span>{st.callNextBtn}</span>
                  </button>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      disabled={!sum.servingPatient}
                      onClick={() => sum.servingPatient && markNoShow(dept.id)}
                      className="tactile-btn rounded-xl bg-coral-light/60 hover:bg-coral-tile disabled:opacity-40 text-coral-ink border-coral-badge/40 px-2 py-2 font-bold text-xs sm:text-sm flex flex-col sm:flex-row items-center justify-center gap-1 text-center hc-card"
                    >
                      <Icon name="close" className="w-4 h-4" />
                      <span>{st.noShowBtn}</span>
                    </button>

                    <button
                      type="button"
                      disabled={!sum.servingPatient && sum.waitingCount === 0}
                      onClick={() => {
                        const target = sum.servingPatient || sum.waitingPatients[0];
                        if (target) sendPatientToEnd(dept.id, target.token);
                      }}
                      className="tactile-btn rounded-xl bg-paper hover:bg-paper-warm disabled:opacity-40 text-ink border-paper-border px-2 py-2 font-bold text-xs sm:text-sm flex flex-col sm:flex-row items-center justify-center gap-1 text-center hc-card"
                    >
                      <Icon name="refresh" className="w-4 h-4 text-civic-mid" />
                      <span>{st.sendEndBtn}</span>
                    </button>

                    <button
                      type="button"
                      disabled={!sum.servingPatient && sum.waitingCount === 0}
                      onClick={() => openMoveModal(dept.id)}
                      className="tactile-btn rounded-xl bg-paper hover:bg-paper-warm disabled:opacity-40 text-ink border-paper-border px-2 py-2 font-bold text-xs sm:text-sm flex flex-col sm:flex-row items-center justify-center gap-1 text-center hc-card"
                    >
                      <Icon name="next" className="w-4 h-4 text-civic-mid" />
                      <span>{st.moveDeptBtn}</span>
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      </div>

      {/* Move Patient Modal */}
      {moveModalDeptId && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="move-modal-title"
          className="fixed inset-0 z-50 bg-ink/70 backdrop-blur-sm flex items-center justify-center p-3"
        >
          <form
            onSubmit={handleConfirmMove}
            className="calm-card hc-card rounded-3xl max-w-md w-full p-5 sm:p-6 space-y-4"
          >
            <h2 id="move-modal-title" className="text-xl font-extrabold text-ink">
              {st.moveModalTitle}
            </h2>

            <div>
              <label htmlFor="move-patient-select" className="block text-sm font-bold text-ink mb-1">
                {st.selectPatientLabel}
              </label>
              <select
                id="move-patient-select"
                value={selectedTokenToMove}
                onChange={(e) => setSelectedTokenToMove(e.target.value)}
                className="w-full min-h-[56px] px-3 py-2 rounded-xl border border-paper-strong bg-white font-bold text-base text-ink"
              >
                {moveCandidates.map((c) => (
                  <option key={c.token} value={c.token}>
                    {c.token} — {c.firstName} ({c.status})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="move-target-dept" className="block text-sm font-bold text-ink mb-1">
                {st.selectTargetDeptLabel}
              </label>
              <select
                id="move-target-dept"
                value={targetMoveDeptId}
                onChange={(e) => setTargetMoveDeptId(e.target.value)}
                className="w-full min-h-[56px] px-3 py-2 rounded-xl border border-civic bg-white font-bold text-base text-ink"
              >
                {DEPARTMENTS.filter((d) => d.id !== moveModalDeptId).map((d) => (
                  <option key={d.id} value={d.id}>
                    {formatStr(st.roomBadge, { room: d.roomNumber })}:{' '}
                    {dict.departments[d.id]?.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setMoveModalDeptId(null)}
                className="tactile-btn rounded-xl bg-paper-warm text-ink border-paper-strong py-3 font-bold flex items-center justify-center gap-1.5"
              >
                <Icon name="close" className="w-4 h-4" />
                <span>{dict.common.cancel}</span>
              </button>
              <button
                type="submit"
                className="tactile-btn rounded-xl bg-civic text-white border-civic-dark py-3 font-extrabold flex items-center justify-center gap-1.5 hc-primary"
              >
                <Icon name="check" className="w-4 h-4" />
                <span>{st.confirmMoveBtn}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </AppShell>
  );
}
