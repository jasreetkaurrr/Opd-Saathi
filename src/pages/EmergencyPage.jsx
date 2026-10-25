import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AppShell } from '../components/AppShell.jsx';
import { Icon } from '../components/Icons.jsx';
import { FloorPlanSvg } from '../components/FloorPlanSvg.jsx';
import { GlossaryNote } from '../components/GlossaryNote.jsx';
import { PLACES, PLACE_MAP } from '../data/hospital.js';
import { useHospital } from '../context/HospitalContext.jsx';
import { findShortestRoute, buildLocalizedSteps } from '../utils/pathfinding.js';
import { speakText, vibrateDevice } from '../utils/sound.js';

export function EmergencyPage() {
  const { dict, lang, prefs, raiseUrgentFlag, activeSavedTokens, getPatientDetails } = useHospital();
  const em = dict.emergencyScreen;
  const mapRef = useRef(null);

  const [fromId, setFromId] = useState('entrance');
  const [viewedFloor, setViewedFloor] = useState(0);
  const [flagRaised, setFlagRaised] = useState(false);

  const route = useMemo(
    () => findShortestRoute(fromId, 'emergency', { avoidStairs: true }),
    [fromId]
  );

  const steps = useMemo(() => (route ? buildLocalizedSteps(route, dict) : []), [route, dict]);

  useEffect(() => {
    if (PLACE_MAP[fromId]) {
      setViewedFloor(PLACE_MAP[fromId].floor);
    }
  }, [fromId]);

  const pageSpeech = `${em.title}. ${em.immediateDirective} ${em.noTokenRule} 112. 108. ${steps
    .map((s) => s.text)
    .join(' ')}`;

  useEffect(() => {
    if (prefs.readAloud) {
      speakText(pageSpeech, lang);
    }
  }, [prefs.readAloud, lang, pageSpeech]);

  const handleRaiseUrgentHere = () => {
    vibrateDevice([350, 120, 350]);
    const activeTicket = activeSavedTokens[0] ? getPatientDetails(activeSavedTokens[0]) : null;
    raiseUrgentFlag({
      placeId: fromId,
      token: activeTicket?.patient?.token || null,
      firstName: activeTicket?.patient?.firstName || '',
    });
    setFlagRaised(true);
    speakText(`${dict.common.urgentHelpSentTitle}. ${dict.common.urgentHelpSentBody}`, lang);
  };

  return (
    <AppShell pageReadText={pageSpeech} hideFirstVisitModal customTitle={em.headerBadge}>
      <div className="max-w-xl mx-auto space-y-5">
        {/* ==================== MAIN EMERGENCY CARD (Matches Screen 8 of Reference Design) ==================== */}
        <section className="calm-card hc-card rounded-3xl overflow-hidden">
          {/* Crimson Rounded Top Banner */}
          <div className="bg-urgent px-5 py-4 flex items-center gap-3 text-white">
            <div className="w-11 h-11 rounded-full bg-white text-urgent flex items-center justify-center shrink-0">
              <Icon name="urgent" className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-extrabold">{em.headerBadge}</h1>
          </div>

          <div className="p-5 sm:p-6 space-y-4">
            <div>
              <h2 className="text-2xl font-extrabold text-urgent">{em.title}</h2>
              <p className="text-base text-ink-muted hc-muted mt-1 leading-snug">
                {em.immediateDirective}
              </p>
            </div>

            {/* 8 Warning Signs List */}
            <div className="space-y-2">
              <h3 className="text-base font-extrabold text-ink">{em.signsHeading}</h3>
              <ul className="space-y-1.5 pl-1">
                {dict.register.dangerSigns.map((sign, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm sm:text-base font-medium text-ink">
                    <span
                      aria-hidden="true"
                      className="w-1.5 h-1.5 rounded-full bg-urgent mt-2.5 shrink-0"
                    />
                    <span>{sign}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Side-by-Side 112 & 108 Pill Call Buttons matching Screen 8 */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <a
                href="tel:112"
                className="tactile-btn rounded-2xl bg-white hover:bg-coral-light text-ink border-paper-strong px-3 py-3 font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 text-center hc-card"
              >
                <Icon name="phone" className="w-5 h-5 text-urgent" />
                <span>{em.police112Short}</span>
              </a>

              <a
                href="tel:108"
                className="tactile-btn rounded-2xl bg-white hover:bg-coral-light text-ink border-paper-strong px-3 py-3 font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 text-center hc-card"
              >
                <Icon name="ambulance" className="w-5 h-5 text-urgent" />
                <span>{em.ambulance108Short}</span>
              </a>
            </div>

            {/* Full-Width Crimson "Show me the way" CTA */}
            <button
              type="button"
              onClick={() => mapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className="tactile-btn w-full rounded-2xl bg-urgent hover:bg-urgent-dark text-white border-urgent-dark px-5 py-3.5 font-extrabold text-lg flex items-center justify-center gap-2.5"
            >
              <Icon name="building" className="w-5 h-5" />
              <span>{em.showWayBtn}</span>
            </button>

            <p className="text-xs sm:text-sm font-semibold text-ink-muted hc-muted text-center">
              {em.noTokenRule}
            </p>
          </div>
        </section>

        {/* Plain-Language First-Appearance Explanation of Casualty */}
        <GlossaryNote term="casualty" />

        {/* Raise Urgent Staff Flag Directly */}
        <section className="calm-card hc-card rounded-3xl border border-coral-badge/40 bg-coral-light/40 p-5 space-y-3">
          <h2 className="text-lg font-extrabold text-ink">{em.urgentFlagCardTitle}</h2>
          <p className="text-sm sm:text-base text-ink-muted hc-muted">{em.urgentFlagCardSub}</p>
          {flagRaised ? (
            <div role="alert" className="rounded-2xl bg-urgent text-white p-4 font-bold space-y-1">
              <p className="text-base font-extrabold">{dict.common.urgentHelpSentTitle}</p>
              <p className="text-sm">{dict.common.urgentHelpSentBody}</p>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleRaiseUrgentHere}
              className="tactile-btn w-full rounded-2xl bg-paper-card hover:bg-coral-tile text-coral-ink border-coral-badge px-4 py-3 font-extrabold text-base flex items-center justify-center gap-2 hc-card"
            >
              <Icon name="flag" className="w-5 h-5 text-urgent" />
              <span>{dict.common.urgentHelp}</span>
            </button>
          )}
        </section>

        {/* Step-Free Map & Route to Emergency (Casualty) */}
        <section ref={mapRef} className="calm-card hc-card rounded-3xl p-4 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 max-w-full">
            <h2 className="text-lg sm:text-xl font-extrabold text-ink">{em.mapSectionTitle}</h2>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2 w-full sm:w-auto max-w-full min-w-0">
              <label htmlFor="em-from-select" className="text-xs sm:text-sm font-bold text-ink shrink-0">
                {em.fromWhereLabel}
              </label>
              <select
                id="em-from-select"
                value={fromId}
                onChange={(e) => setFromId(e.target.value)}
                className="min-h-[56px] w-full sm:w-auto max-w-full min-w-0 px-3 py-2 rounded-xl border border-paper-strong bg-white text-ink font-bold text-sm"
              >
                {[0, 1, 2].map((fl) => (
                  <optgroup key={fl} label={dict.floors[fl]}>
                    {PLACES.filter((p) => p.floor === fl && p.id !== 'emergency').map((p) => (
                      <option key={p.id} value={p.id}>
                        {dict.places[p.id]?.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          </div>

          {route && route.floorSegments.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {route.floorSegments.map((seg, i) => (
                <button
                  key={`${seg.floor}-${i}`}
                  type="button"
                  onClick={() => setViewedFloor(seg.floor)}
                  className={`tactile-btn px-3.5 py-2 rounded-xl border font-extrabold text-sm flex items-center gap-1.5 ${
                    viewedFloor === seg.floor
                      ? 'bg-urgent text-white border-urgent-dark'
                      : 'bg-paper text-ink border-paper-strong hc-card'
                  }`}
                >
                  <Icon name="map" className="w-4 h-4" />
                  <span>{dict.floors[seg.floor]}</span>
                </button>
              ))}
            </div>
          )}

          <FloorPlanSvg floor={viewedFloor} route={route} isEmergencyRoute />

          <ol className="space-y-2.5">
            {steps.map((st) => (
              <li
                key={st.index}
                className="rounded-2xl border border-coral-badge/30 bg-coral-light/30 p-3.5 flex items-start gap-3 hc-card"
              >
                <span className="w-8 h-8 rounded-full bg-urgent text-white font-extrabold text-sm flex items-center justify-center shrink-0 mt-0.5">
                  {st.index}
                </span>
                <span className="font-bold text-sm sm:text-base text-ink leading-snug">
                  {st.text}
                </span>
              </li>
            ))}
          </ol>

          <p className="text-xs font-medium text-ink-muted hc-muted">
            {dict.register.safetyDisclaimer}
          </p>
        </section>
      </div>
    </AppShell>
  );
}
