import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AppShell } from '../components/AppShell.jsx';
import { Icon } from '../components/Icons.jsx';
import { FloorPlanSvg } from '../components/FloorPlanSvg.jsx';
import { PLACES, PLACE_MAP } from '../data/hospital.js';
import { useHospital } from '../context/HospitalContext.jsx';
import { DICTIONARIES, formatStr } from '../i18n/index.js';
import { findShortestRoute, buildLocalizedSteps } from '../utils/pathfinding.js';
import { speakText, stopSpeech } from '../utils/sound.js';

export function WayfindingPage() {
  const { dict, lang, prefs, updatePrefs, activeSavedTokens, getPatientDetails } = useHospital();
  const [searchParams] = useSearchParams();
  const w = dict.wayfinding;
  const stepsSectionRef = useRef(null);

  const activeTicket = useMemo(() => {
    const paramToken = searchParams.get('token');
    if (paramToken) return getPatientDetails(paramToken);
    if (activeSavedTokens[0]) return getPatientDetails(activeSavedTokens[0]);
    return null;
  }, [searchParams, activeSavedTokens, getPatientDetails]);

  const initialFrom = searchParams.get('from') || 'entrance';
  const initialTo = searchParams.get('to') || activeTicket?.dept?.placeId || 'room_3';

  const [fromId, setFromId] = useState(PLACE_MAP[initialFrom] ? initialFrom : 'entrance');
  const [toId, setToId] = useState(PLACE_MAP[initialTo] ? initialTo : 'room_3');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewedFloor, setViewedFloor] = useState(() => PLACE_MAP[initialTo]?.floor ?? 1);
  const [activeStepIdx, setActiveStepIdx] = useState(0);
  const [speakingStepIdx, setSpeakingStepIdx] = useState(null);
  const [lostModalOpen, setLostModalOpen] = useState(false);
  const [savedIntendedDestId, setSavedIntendedDestId] = useState(
    PLACE_MAP[initialTo] ? initialTo : 'room_3'
  );
  const [isMicListening, setIsMicListening] = useState(false);
  const recRef = useRef(null);

  useEffect(() => {
    const qFrom = searchParams.get('from');
    const qTo = searchParams.get('to');
    if (qFrom && PLACE_MAP[qFrom]) {
      setFromId(qFrom);
    }
    if (qTo && PLACE_MAP[qTo]) {
      setToId(qTo);
      setSavedIntendedDestId(qTo);
      setViewedFloor(PLACE_MAP[qTo].floor);
    }
  }, [searchParams]);

  const avoidStairs = Boolean(prefs.avoidStairs || prefs.assistedMode);

  const route = useMemo(
    () => findShortestRoute(fromId, toId, { avoidStairs }),
    [fromId, toId, avoidStairs]
  );

  const steps = useMemo(() => (route ? buildLocalizedSteps(route, dict) : []), [route, dict]);

  useEffect(() => {
    setActiveStepIdx(0);
    if (PLACE_MAP[toId]) {
      setViewedFloor(PLACE_MAP[toId].floor);
    }
  }, [fromId, toId, avoidStairs]);

  const filteredPlaces = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return PLACES;
    return PLACES.filter((p) => {
      const enTxt = DICTIONARIES.en.places[p.id];
      const hiTxt = DICTIONARIES.hi.places[p.id];
      const haystack = `${p.id} ${enTxt?.name || ''} ${enTxt?.landmark || ''} ${hiTxt?.name || ''} ${hiTxt?.landmark || ''}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [searchQuery]);

  const handleToggleAvoidStairs = () => {
    updatePrefs({ avoidStairs: !avoidStairs });
  };

  const handleSelectStep = (idx) => {
    if (!steps[idx]) return;
    setActiveStepIdx(idx);
    setViewedFloor(steps[idx].floor);
  };

  const handleListenAllSteps = () => {
    if (!steps.length) return;
    if (speakingStepIdx === 'all') {
      stopSpeech();
      setSpeakingStepIdx(null);
      return;
    }
    setSpeakingStepIdx('all');
    const fullText = steps.map((s) => `${s.index}: ${s.text}`).join(' ');
    speakText(fullText, lang, () => setSpeakingStepIdx(null));
  };

  const handleListenSingleStep = (step) => {
    setSpeakingStepIdx(step.index);
    setViewedFloor(step.floor);
    setActiveStepIdx(step.index - 1);
    speakText(step.text, lang, () => setSpeakingStepIdx(null));
  };

  const handleImLost = () => {
    if (toId !== 'help_desk') {
      setSavedIntendedDestId(toId);
    }
    setToId('help_desk');
    setViewedFloor(PLACE_MAP[fromId]?.floor ?? 0);
    setLostModalOpen(true);
  };

  const SpeechRecognitionImpl =
    typeof window !== 'undefined'
      ? window.SpeechRecognition || window.webkitSpeechRecognition || null
      : null;

  const handleVoiceSearch = () => {
    if (!SpeechRecognitionImpl) return;
    if (isMicListening) {
      recRef.current?.stop();
      setIsMicListening(false);
      return;
    }
    try {
      const rec = new SpeechRecognitionImpl();
      recRef.current = rec;
      rec.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
      rec.onstart = () => setIsMicListening(true);
      rec.onend = () => setIsMicListening(false);
      rec.onerror = () => setIsMicListening(false);
      rec.onresult = (e) => {
        const spoken = e.results?.[0]?.[0]?.transcript?.trim() || '';
        if (spoken) setSearchQuery(spoken);
      };
      rec.start();
    } catch {
      setIsMicListening(false);
    }
  };

  // 8 Quick Category Tiles matching Screen 6 of Reference Design
  const quickCategoryTiles = [
    {
      id: activeTicket?.dept?.placeId || 'room_3',
      label: activeTicket
        ? formatStr(dict.slip.roomText, { room: activeTicket.dept.roomNumber })
        : w.catRooms,
      icon: 'door',
    },
    { id: 'ward_4', label: w.catWards, icon: 'ward' },
    { id: 'pharmacy', label: w.catPharmacy, icon: 'pharmacy' },
    { id: 'laboratory', label: w.catLab, icon: 'lab' },
    { id: 'xray', label: w.catXray, icon: 'xray' },
    { id: 'water_g', label: w.catWater, icon: 'water' },
    { id: 'toilets_g', label: w.catToilets, icon: 'toilet' },
    { id: 'help_desk', label: w.catHelp, icon: 'help' },
  ];

  const activeStep = steps[activeStepIdx] || null;
  const intendedDestId = savedIntendedDestId || toId;
  const intendedDestPlace = PLACE_MAP[intendedDestId] || PLACE_MAP.help_desk;
  const enDest = DICTIONARIES.en.places[intendedDestPlace.id];
  const hiDest = DICTIONARIES.hi.places[intendedDestPlace.id];
  const destDisplayName = dict.places[toId]?.name || toId;

  const pageSpeech = steps.map((s) => s.text).join(' ');

  return (
    <AppShell pageReadText={pageSpeech} customTitle={w.pageTitle}>
      <div className="space-y-5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ==================== TOP SEARCH + 4x2 QUICK PLACES + MAP CARD (Matches Screen 6) ==================== */}
        <section className="lg:col-span-7 min-w-0 calm-card hc-card rounded-3xl p-4 sm:p-6 space-y-4">
          {/* Search Input Row */}
          <div className="flex flex-wrap sm:flex-nowrap gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <label htmlFor="place-search-input" className="sr-only">
                {w.searchPlaceholder}
              </label>
              <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-ink-soft">
                <Icon name="search" className="w-5 h-5" />
              </span>
              <input
                id="place-search-input"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={w.searchPlaceholder}
                className="w-full min-h-[56px] pl-11 pr-4 py-2.5 rounded-2xl border border-paper-strong focus:border-civic bg-white text-ink font-semibold text-base"
              />
            </div>
            {SpeechRecognitionImpl && (
              <button
                type="button"
                onClick={handleVoiceSearch}
                aria-label={dict.register.micSpeak}
                className={`tactile-btn px-3.5 rounded-2xl font-bold flex items-center justify-center gap-1.5 ${
                  isMicListening
                    ? 'bg-ochre text-white border-ochre animate-pulse'
                    : 'bg-civic-light text-civic border-civic-border hc-card'
                }`}
              >
                <Icon name="mic" className="w-5 h-5" />
                <span className="text-sm">{dict.register.micSpeak}</span>
              </button>
            )}
          </div>

          {/* Search Results Pills when typing */}
          {searchQuery.trim() !== '' && (
            <div className="rounded-2xl border border-civic-border bg-civic-light/40 p-3 flex flex-wrap gap-2">
              {filteredPlaces.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setToId(p.id);
                    setSavedIntendedDestId(p.id);
                    setSearchQuery('');
                  }}
                  className="tactile-btn px-3 py-2 rounded-xl bg-white hover:bg-civic hover:text-white border-civic-border text-ink font-bold text-sm flex items-center gap-1.5 hc-card"
                >
                  <Icon name={p.icon} className="w-4 h-4" />
                  <span>
                    {dict.places[p.id]?.name} ({dict.floors[`short${p.floor}`]})
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* 4x2 Soft Sage Category Tiles matching Screen 6 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {quickCategoryTiles.map((tile) => {
              const selected = toId === tile.id;
              return (
                <button
                  key={`${tile.id}-${tile.label}`}
                  type="button"
                  onClick={() => {
                    setToId(tile.id);
                    setSavedIntendedDestId(tile.id);
                  }}
                  className={`tactile-btn rounded-2xl p-3 flex flex-col items-center justify-center text-center gap-1.5 min-w-0 ${
                    selected
                      ? 'bg-civic-tile border-civic-mid text-ink hc-primary'
                      : 'bg-paper/85 hover:bg-civic-light/60 border-paper-border text-ink hc-card'
                  }`}
                >
                  <Icon name={tile.icon} className="w-6 h-6 text-civic" />
                  <span className="font-bold text-xs sm:text-sm leading-snug">{tile.label}</span>
                </button>
              );
            })}
          </div>

          {/* From & To Selectors + Avoid Stairs Switch */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label htmlFor="wayfinding-from" className="block text-sm font-extrabold text-ink mb-1">
                {w.fromLabel}
              </label>
              <select
                id="wayfinding-from"
                value={fromId}
                onChange={(e) => setFromId(e.target.value)}
                className="w-full min-h-[56px] px-3.5 py-2.5 rounded-2xl border border-paper-strong bg-white text-ink font-bold text-sm sm:text-base"
              >
                {[0, 1, 2].map((fl) => (
                  <optgroup key={fl} label={dict.floors[fl]}>
                    {PLACES.filter((p) => p.floor === fl).map((p) => (
                      <option key={p.id} value={p.id}>
                        {dict.places[p.id]?.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="wayfinding-to" className="block text-sm font-extrabold text-ink mb-1">
                {w.toLabel}
              </label>
              <select
                id="wayfinding-to"
                value={toId}
                onChange={(e) => {
                  setToId(e.target.value);
                  setSavedIntendedDestId(e.target.value);
                }}
                className="w-full min-h-[56px] px-3.5 py-2.5 rounded-2xl border border-civic bg-white text-ink font-bold text-sm sm:text-base"
              >
                {[0, 1, 2].map((fl) => (
                  <optgroup key={fl} label={dict.floors[fl]}>
                    {PLACES.filter((p) => p.floor === fl).map((p) => (
                      <option key={p.id} value={p.id}>
                        {dict.places[p.id]?.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          </div>

          {/* Avoid Stairs Toggle Row */}
          <div className="rounded-2xl border border-civic-border bg-civic-light/55 p-3 flex items-center justify-between gap-3 hc-card">
            <div className="flex items-center gap-2.5 min-w-0">
              <Icon name="ramp" className="w-6 h-6 text-civic-mid shrink-0" />
              <label
                htmlFor="avoid-stairs-switch"
                className="font-extrabold text-ink text-sm sm:text-base cursor-pointer leading-snug"
              >
                {dict.common.avoidStairs}
              </label>
            </div>
            <button
              id="avoid-stairs-switch"
              type="button"
              role="switch"
              aria-checked={avoidStairs}
              onClick={handleToggleAvoidStairs}
              className={`tactile-btn min-w-[88px] px-3.5 py-2 rounded-full border font-extrabold text-sm flex items-center justify-center gap-1.5 shrink-0 ${
                avoidStairs
                  ? 'bg-civic-mid text-white border-civic hc-primary'
                  : 'bg-white text-ink border-paper-strong hc-card'
              }`}
            >
              <Icon name={avoidStairs ? 'check' : 'stairs'} className="w-4 h-4" />
              <span>{avoidStairs ? dict.common.switchOn : dict.common.switchOff}</span>
            </button>
          </div>

          {/* Reassurance Banner when guided to Help Desk via "I'm lost" */}
          {toId === 'help_desk' && savedIntendedDestId && savedIntendedDestId !== 'help_desk' && (
            <div className="hc-card rounded-2xl border-2 border-ochre bg-ochre-light p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="font-extrabold text-base text-ink">{w.imLostTitle}</p>
                <p className="text-xs sm:text-sm font-semibold text-ink-muted hc-muted">
                  {dict.places.help_desk?.name} ({dict.floors[0]})
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setLostModalOpen(true)}
                  className="tactile-btn px-3 py-2 rounded-xl bg-ochre text-white border-ochre font-bold text-xs sm:text-sm flex items-center gap-1.5"
                >
                  <Icon name="expand" className="w-4 h-4" />
                  <span>{dict.slip.showLargeBtn}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setToId(savedIntendedDestId)}
                  className="tactile-btn px-3 py-2 rounded-xl bg-white text-ink border-paper-strong font-bold text-xs sm:text-sm flex items-center gap-1.5 hc-card"
                >
                  <Icon name="back" className="w-4 h-4" />
                  <span>
                    {formatStr(w.resumeOriginalRouteBtn, {
                      place: dict.places[savedIntendedDestId]?.name || savedIntendedDestId,
                    })}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* ==================== FLOOR HEADER + BLUEPRINT MAP + CTA ==================== */}
          {route && (
            <div className="space-y-3 pt-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-xl font-extrabold text-ink">{dict.floors[viewedFloor]}</h2>
                  <p className="text-xs sm:text-sm font-semibold text-ink-muted hc-muted">
                    {formatStr(w.routeSummary, {
                      distance: route.totalDistance,
                      walkMins: route.walkMinutes,
                    })}{' '}
                    • {!route.usesStairs ? w.stairFreeBadge : w.usesStairsBadge}
                  </p>
                </div>

                {/* Floor Switcher Pills (GF / 1F / 2F) */}
                <div className="flex flex-wrap gap-1.5">
                  {[0, 1, 2].map((fl) => {
                    const active = viewedFloor === fl;
                    const inRoute = route.floorSegments.some((s) => s.floor === fl);
                    return (
                      <button
                        key={fl}
                        type="button"
                        onClick={() => setViewedFloor(fl)}
                        className={`tactile-btn px-3 py-1.5 rounded-xl font-extrabold text-xs sm:text-sm flex items-center gap-1 ${
                          active
                            ? 'bg-civic text-white border-civic-dark hc-primary'
                            : inRoute
                            ? 'bg-civic-light text-civic border-civic-border hc-card'
                            : 'bg-paper text-ink-muted border-paper-border hc-card'
                        }`}
                      >
                        <Icon name="map" className="w-3.5 h-3.5" />
                        <span>{dict.floors[`short${fl}`]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <FloorPlanSvg
                floor={viewedFloor}
                route={route}
                activeStepPlaceId={activeStep?.placeId}
                isEmergencyRoute={toId === 'emergency'}
                onSelectPlace={(clickedId) => {
                  setToId(clickedId);
                  setSavedIntendedDestId(clickedId);
                }}
              />

              {/* Deep-Forest CTA matching bottom of Screen 6 */}
              <button
                type="button"
                onClick={() =>
                  stepsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }
                className="tactile-btn w-full rounded-2xl bg-civic hover:bg-civic-dark text-white border-civic-dark px-5 py-3.5 font-extrabold text-base sm:text-lg flex items-center justify-center gap-2 hc-primary"
              >
                <span>{w.walkModeBtn}</span>
                <Icon name="next" className="w-5 h-5" />
              </button>
            </div>
          )}
        </section>

        {/* ==================== DIRECTIONS CARD (Matches Screen 7 of Reference Design) ==================== */}
        {steps.length > 0 && (
          <section
            ref={stepsSectionRef}
            className="lg:col-span-5 min-w-0 calm-card hc-card rounded-3xl p-5 sm:p-6 space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xl sm:text-2xl font-extrabold text-ink">
                {formatStr(w.stepsHeading, { place: destDisplayName })}
              </h2>
              {/* Prev / Next Walk Step Controls */}
              {steps.length > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={activeStepIdx === 0}
                    onClick={() => handleSelectStep(Math.max(0, activeStepIdx - 1))}
                    className="tactile-btn px-3 py-1.5 rounded-xl bg-paper disabled:opacity-45 text-ink border-paper-border font-bold text-xs sm:text-sm flex items-center gap-1 hc-card"
                  >
                    <Icon name="back" className="w-4 h-4" />
                    <span>{w.prevStep}</span>
                  </button>
                  <button
                    type="button"
                    disabled={activeStepIdx >= steps.length - 1}
                    onClick={() => handleSelectStep(Math.min(steps.length - 1, activeStepIdx + 1))}
                    className="tactile-btn px-3 py-1.5 rounded-xl bg-civic-light disabled:opacity-45 text-civic border-civic-border font-bold text-xs sm:text-sm flex items-center gap-1 hc-card"
                  >
                    <span>{w.nextStep}</span>
                    <Icon name="next" className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Numbered Forest-Circle Steps matching Screen 7 */}
            <ol className="space-y-3">
              {steps.map((step, idx) => {
                const isSelected = idx === activeStepIdx;
                return (
                  <li
                    key={step.index}
                    onClick={() => handleSelectStep(idx)}
                    className={`rounded-2xl border p-3.5 flex flex-col sm:flex-row sm:items-start justify-between gap-2.5 cursor-pointer transition hc-card ${
                      isSelected
                        ? 'border-civic-mid bg-civic-light/50'
                        : 'border-paper-border bg-white hover:bg-paper/70'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <span className="w-8 h-8 rounded-full bg-civic text-white font-extrabold text-sm flex items-center justify-center shrink-0 mt-0.5">
                        {step.index}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-base sm:text-lg text-ink leading-snug">
                          {step.text}
                        </p>
                        <p className="text-xs font-semibold text-ink-muted hc-muted mt-0.5">
                          {dict.floors[step.floor]}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleListenSingleStep(step);
                      }}
                      aria-label={`${w.listenStepBtn} ${step.index}`}
                      className="tactile-btn self-end sm:self-auto shrink-0 px-3 py-1.5 rounded-xl bg-paper hover:bg-civic-light border-paper-border text-ink font-bold flex items-center gap-1.5 text-xs sm:text-sm hc-card"
                    >
                      <Icon name="speaker" className="w-4 h-4 text-civic-mid" />
                      <span>{w.listenStepBtn}</span>
                    </button>
                  </li>
                );
              })}
            </ol>

            {/* Bottom Listen + I'm Lost Pair + Show Help Desk Link matching Screen 7 */}
            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                type="button"
                onClick={handleListenAllSteps}
                className={`tactile-btn rounded-2xl px-4 py-3 font-extrabold text-base flex items-center justify-center gap-2 ${
                  speakingStepIdx === 'all'
                    ? 'bg-ochre text-white border-ochre'
                    : 'bg-civic-mid hover:bg-civic text-white border-civic hc-primary'
                }`}
              >
                <Icon name="speaker" className="w-5 h-5" />
                <span>
                  {speakingStepIdx === 'all' ? dict.common.stopListening : w.listenAllBtn}
                </span>
              </button>

              <button
                type="button"
                onClick={handleImLost}
                className="tactile-btn rounded-2xl bg-paper-warm hover:bg-ochre-light text-ink border-paper-strong px-4 py-3 font-extrabold text-base flex items-center justify-center gap-2 hc-card"
              >
                <Icon name="lost" className="w-5 h-5 text-civic" />
                <span>{w.imLostBtn}</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                if (toId !== 'help_desk') setSavedIntendedDestId(toId);
                setToId('help_desk');
                setViewedFloor(0);
              }}
              className="tactile-btn w-full rounded-2xl bg-transparent hover:bg-paper-warm border-paper-border text-ink-muted hc-muted px-4 py-2.5 font-bold text-sm flex items-center justify-center gap-2"
            >
              <Icon name="help" className="w-4 h-4 text-civic-mid" />
              <span>{w.showHelpDeskLink}</span>
            </button>
          </section>
        )}
        </div>

        {/* ==================== 3-FLOOR PLANS OVERVIEW PANEL (Matches Bottom-Left of Reference Design) ==================== */}
        <section className="calm-card hc-card rounded-3xl p-4 sm:p-5 space-y-3">
          <h2 className="text-base sm:text-lg font-extrabold text-ink">{w.allFloorsTitle}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[0, 1, 2].map((fl) => (
              <div
                key={`overview-${fl}`}
                className={`rounded-2xl border p-2.5 space-y-2 hc-card ${
                  viewedFloor === fl
                    ? 'border-civic-mid bg-civic-light/35'
                    : 'border-paper-border bg-white'
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    setViewedFloor(fl);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="tactile-btn w-full rounded-xl bg-paper hover:bg-civic-light border-paper-border px-3 py-2 font-extrabold text-sm text-ink flex items-center justify-between gap-2 hc-card"
                >
                  <span className="flex items-center gap-1.5">
                    <Icon name="map" className="w-4 h-4 text-civic-mid" />
                    <span>{dict.floors[fl]}</span>
                  </span>
                  <Icon name="expand" className="w-4 h-4 text-civic" />
                </button>
                <FloorPlanSvg floor={fl} route={route} showLegend={false} />
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* ==================== "I'M LOST" BILINGUAL STAFF CARD MODAL ==================== */}
      {lostModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="lost-modal-title"
          className="fixed inset-0 z-50 bg-ink/75 backdrop-blur-sm flex items-center justify-center p-3 overflow-y-auto"
        >
          <div className="calm-card hc-card border-2 border-civic rounded-3xl max-w-xl w-full p-5 sm:p-6 space-y-4 my-auto">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-full bg-civic-light text-civic flex items-center justify-center shrink-0">
                <Icon name="help" className="w-6 h-6" />
              </div>
              <div>
                <h2 id="lost-modal-title" className="text-xl sm:text-2xl font-extrabold text-ink">
                  {w.imLostTitle}
                </h2>
                <p className="text-sm sm:text-base text-ink-muted hc-muted mt-0.5">{w.imLostSub}</p>
              </div>
            </div>

            <div className="rounded-2xl border-2 border-civic-border bg-civic-light/60 p-4 sm:p-5 space-y-3 text-ink">
              <p className="text-xs font-extrabold uppercase tracking-wider text-civic">
                {DICTIONARIES.en.wayfinding.showStaffCardHeader} •{' '}
                {DICTIONARIES.hi.wayfinding.showStaffCardHeader}
              </p>

              {/* Hindi Block */}
              <div className="border-b border-civic-border pb-3">
                <p className="text-xs sm:text-sm font-bold text-ink-muted">
                  {DICTIONARIES.hi.wayfinding.showStaffDestinationLabel}
                </p>
                <p className="text-2xl font-black text-ink mt-0.5">{hiDest?.name}</p>
                <p className="text-base font-extrabold text-civic">
                  {DICTIONARIES.hi.floors[intendedDestPlace.floor]} • {hiDest?.landmark}
                </p>
              </div>

              {/* English Block */}
              <div>
                <p className="text-xs sm:text-sm font-bold text-ink-muted">
                  {DICTIONARIES.en.wayfinding.showStaffDestinationLabel}
                </p>
                <p className="text-2xl font-black text-ink mt-0.5">{enDest?.name}</p>
                <p className="text-base font-extrabold text-civic">
                  {DICTIONARIES.en.floors[intendedDestPlace.floor]} • {enDest?.landmark}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setToId('help_desk');
                  setViewedFloor(PLACE_MAP[fromId]?.floor ?? 0);
                  setLostModalOpen(false);
                }}
                className="tactile-btn rounded-2xl bg-civic text-white border-civic-dark px-4 py-3 font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 hc-primary"
              >
                <Icon name="pin" className="w-5 h-5" />
                <span>{w.routeToHelpDeskBtn}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setToId(intendedDestPlace.id);
                  setLostModalOpen(false);
                }}
                className="tactile-btn rounded-2xl bg-paper-warm text-ink border-paper-strong px-4 py-3 font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 hc-card"
              >
                <Icon name="back" className="w-5 h-5" />
                <span>
                  {formatStr(w.resumeOriginalRouteBtn, {
                    place: dict.places[intendedDestPlace.id]?.name || intendedDestPlace.id,
                  })}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
