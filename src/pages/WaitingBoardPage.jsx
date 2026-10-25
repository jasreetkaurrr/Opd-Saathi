import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../components/Icons.jsx';
import { DEPARTMENTS } from '../data/departments.js';
import { useHospital } from '../context/HospitalContext.jsx';
import { DICTIONARIES, formatStr } from '../i18n/index.js';
import { playTokenCalledChime, speakText, unlockAudio } from '../utils/sound.js';

export function WaitingBoardPage() {
  const { hospitalState, simClock, getDepartmentQueueSummary } = useHospital();

  const [boardLang, setBoardLang] = useState('en');
  const [autoSwitch, setAutoSwitch] = useState(true);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [highlightedDeptId, setHighlightedDeptId] = useState(null);

  const lastAnnouncedIdRef = useRef(hospitalState.lastCalledEvent?.id || null);

  useEffect(() => {
    if (!autoSwitch) return undefined;
    const timer = window.setInterval(() => {
      setBoardLang((prev) => (prev === 'en' ? 'hi' : 'en'));
    }, 7000);
    return () => window.clearInterval(timer);
  }, [autoSwitch]);

  const bDict = DICTIONARIES[boardLang] || DICTIONARIES.en;
  const b = bDict.board;

  const announceEvent = (evt, langForSpeech) => {
    if (!evt) return;
    playTokenCalledChime();
    const targetDict = DICTIONARIES[langForSpeech] || DICTIONARIES.en;
    const msg = formatStr(targetDict.board.announceTemplate, {
      token: evt.token,
      room: evt.roomNumber,
    });
    speakText(msg, langForSpeech);
  };

  useEffect(() => {
    const evt = hospitalState.lastCalledEvent;
    if (!evt || evt.id === lastAnnouncedIdRef.current) return;
    lastAnnouncedIdRef.current = evt.id;
    setHighlightedDeptId(evt.departmentId);
    announceEvent(evt, boardLang);

    const clearTimer = window.setTimeout(() => {
      setHighlightedDeptId(null);
    }, 6500);
    return () => window.clearTimeout(clearTimer);
  }, [hospitalState.lastCalledEvent?.id]);

  // Featured Spotlight Department (latest called event, or General Medicine Room 1)
  const lastEvent = hospitalState.lastCalledEvent;
  const featuredDept =
    DEPARTMENTS.find((d) => d.id === lastEvent?.departmentId) || DEPARTMENTS[0];
  const featuredSummary = getDepartmentQueueSummary(featuredDept.id);
  const featuredToken =
    lastEvent?.token || featuredSummary.servingPatient?.token || 'MED-042';
  const featuredNextThree = featuredSummary.waitingPatients.slice(0, 3);

  return (
    <div
      onClick={() => {
        unlockAudio();
        setAudioUnlocked(true);
      }}
      className="min-h-screen bg-gradient-to-b from-[#16362F] to-[#1C443D] text-white flex flex-col p-3 sm:p-6 gap-5"
    >
      {/* ==================== TOP HEADER BAR (Matches Screen 14 Dark Forest TV Display) ==================== */}
      <header className="rounded-3xl bg-[#13302A]/90 border border-white/15 px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 text-white flex items-center justify-center shrink-0">
            <Icon name="building" className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg sm:text-2xl font-extrabold tracking-tight text-white">
              {bDict.appName}
            </h1>
            <p className="text-xs sm:text-sm font-medium text-[#C5DCD5]">
              {bDict.hospitalName} • {simClock}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Emergency button on every screen */}
          <Link
            to="/emergency"
            className="tactile-btn rounded-2xl bg-urgent hover:bg-urgent-dark text-white border-white/25 px-3.5 py-2 font-extrabold text-sm flex items-center gap-1.5"
          >
            <Icon name="emergency" className="w-4 h-4" />
            <span>{bDict.common.emergency} (112)</span>
          </Link>

          <button
            type="button"
            onClick={() => {
              unlockAudio();
              setAudioUnlocked(true);
              announceEvent(
                lastEvent || { token: featuredToken, roomNumber: featuredDept.roomNumber },
                boardLang
              );
            }}
            className={`tactile-btn rounded-2xl px-3.5 py-2 font-bold text-sm flex items-center gap-1.5 ${
              audioUnlocked
                ? 'bg-[#2C6456] text-white border-white/30'
                : 'bg-[#F4F2EA] text-[#16362F] border-white animate-pulse'
            }`}
          >
            <Icon name="speaker" className="w-4 h-4" />
            <span>{audioUnlocked ? b.replayLast : b.soundUnlock}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (autoSwitch) {
                setAutoSwitch(false);
              } else {
                setBoardLang((prev) => (prev === 'en' ? 'hi' : 'en'));
                setAutoSwitch(true);
              }
            }}
            className="tactile-btn rounded-2xl bg-white/10 hover:bg-white/20 text-white border-white/25 px-3.5 py-2 font-bold text-sm flex items-center gap-1.5"
          >
            <Icon name="globe" className="w-4 h-4" />
            <span>
              {autoSwitch ? `${b.pauseLang} (${boardLang.toUpperCase()})` : b.resumeAuto}
            </span>
          </button>
        </div>
      </header>

      {/* ==================== HERO "NOW SERVING" SPOTLIGHT CARD (Matches Screen 14 of Reference Design) ==================== */}
      <section
        aria-live="polite"
        className="rounded-3xl bg-[#15352E] border border-white/20 p-5 sm:p-8 shadow-calm space-y-5"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
          <div className="space-y-1.5">
            <p className="text-lg sm:text-2xl font-bold text-[#CFE3DC]">{b.nowCallingBanner}</p>
            <p className="font-mono text-5xl sm:text-7xl font-black tracking-tight text-white">
              {featuredToken}
            </p>
            <p className="text-xl sm:text-2xl font-bold text-[#E6F1ED] pt-1">
              {formatStr(b.pleaseGoTo, { room: featuredDept.roomNumber })}
            </p>
            <p className="text-sm sm:text-base font-medium text-[#B7D1C9] pt-1">
              {bDict.slip.departmentLabel}: {bDict.departments[featuredDept.id]?.shortName}
            </p>
          </div>

          {/* Next 3 Tokens Dark Bordered Box with Cream Pills matching Screen 14 */}
          <div className="rounded-2xl border border-white/25 bg-white/5 p-4 sm:p-5 space-y-3">
            <p className="text-sm sm:text-base font-bold text-[#CFE3DC]">{b.colNextThree}</p>
            {featuredNextThree.length === 0 ? (
              <p className="text-sm text-white/60">{bDict.staff.queueEmpty}</p>
            ) : (
              <div className="flex flex-wrap gap-2.5">
                {featuredNextThree.map((np) => (
                  <span
                    key={np.token}
                    className="px-4 py-2 rounded-xl bg-[#F4F2EA] text-[#16362F] font-mono font-extrabold text-base sm:text-lg shadow-sm"
                  >
                    {np.token}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Spoken Announcement Strip matching bottom of Screen 14 */}
        <div className="rounded-2xl bg-[#1F4A41] border border-white/15 px-4 py-3 flex items-center gap-3 text-sm sm:text-lg font-semibold text-white">
          <Icon name="speaker" className="w-5 h-5 text-[#BFD8CC] shrink-0" />
          <span>
            {formatStr(b.announceTemplate, {
              token: featuredToken,
              room: featuredDept.roomNumber,
            })}
          </span>
        </div>
      </section>

      {/* ==================== ALL 8 ROOMS LIVE QUEUE GRID ==================== */}
      <main className="flex-1 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3.5">
        {DEPARTMENTS.map((dept) => {
          const sum = getDepartmentQueueSummary(dept.id);
          const isFlashing = highlightedDeptId === dept.id;
          const nextThree = sum.waitingPatients.slice(0, 3);

          const statusBanner =
            sum.doctorStatus === 'break'
              ? formatStr(bDict.turn.statusBreak, { time: sum.breakUntil })
              : sum.doctorStatus === 'late'
              ? formatStr(bDict.turn.statusLate, { mins: sum.lateMinutes })
              : b.onTime;

          return (
            <article
              key={dept.id}
              className={`rounded-3xl border p-4 sm:p-5 flex flex-col justify-between gap-3.5 transition-all ${
                isFlashing
                  ? 'bg-[#235449] border-[#BFD8CC] ring-2 ring-[#BFD8CC]'
                  : 'bg-[#14332C]/90 border-white/15'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-3 py-1 rounded-xl bg-[#BFD8CC] text-[#16362F] font-extrabold text-sm">
                    {formatStr(bDict.slip.roomText, { room: dept.roomNumber })}
                  </span>
                  <span className="text-xs font-semibold text-[#C5DCD5]">
                    {bDict.floors.short1}
                  </span>
                </div>

                <div>
                  <h2 className="text-lg font-extrabold text-white leading-snug">
                    {bDict.departments[dept.id]?.shortName}
                  </h2>
                  <p className="text-xs font-medium text-[#B7D1C9] mt-0.5">
                    {dept.doctor[boardLang] || dept.doctor.en}
                  </p>
                </div>

                <div className="rounded-2xl bg-[#0F2621] border border-white/15 p-3.5 text-center">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#BFD8CC]">
                    {b.colServing}
                  </p>
                  <p className="font-mono text-3xl font-black text-white mt-0.5">
                    {sum.servingPatient ? sum.servingPatient.token : '—'}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <p className="text-xs font-bold text-[#BFD8CC]">{b.colNextThree}</p>
                  {nextThree.length === 0 ? (
                    <p className="text-xs text-white/50">{bDict.staff.queueEmpty}</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {nextThree.map((np) => (
                        <span
                          key={np.token}
                          className="px-2.5 py-1 rounded-lg bg-[#F4F2EA] text-[#16362F] font-mono font-bold text-xs"
                        >
                          {np.token}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div
                className={`rounded-xl px-3 py-2 font-bold text-xs flex items-center gap-1.5 ${
                  sum.doctorStatus === 'available'
                    ? 'bg-white/10 text-[#D4EAE2]'
                    : 'bg-[#FDF3DC] text-[#162824]'
                }`}
              >
                <Icon
                  name={sum.doctorStatus === 'available' ? 'check' : 'clock'}
                  className="w-4 h-4 shrink-0"
                />
                <span>{statusBanner}</span>
              </div>
            </article>
          );
        })}
      </main>

      {/* Navigation Footer on TV */}
      <footer className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#BFD8CC] pt-1">
        <span>{bDict.common.sampleHospitalNote}</span>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/"
            className="tactile-btn rounded-xl bg-white/10 hover:bg-white/20 border-white/25 px-3 py-2 font-bold text-xs text-white flex items-center gap-1.5"
          >
            <Icon name="home" className="w-4 h-4" />
            <span>{bDict.common.home}</span>
          </Link>
          <Link
            to="/staff"
            className="tactile-btn rounded-xl bg-white/10 hover:bg-white/20 border-white/25 px-3 py-2 font-bold text-xs text-white flex items-center gap-1.5"
          >
            <Icon name="users" className="w-4 h-4" />
            <span>{bDict.common.staffPortal}</span>
          </Link>
        </div>
      </footer>
    </div>
  );
}
