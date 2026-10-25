import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { AppShell } from '../components/AppShell.jsx';
import { Icon } from '../components/Icons.jsx';
import { FloorPlanSvg } from '../components/FloorPlanSvg.jsx';
import { useHospital } from '../context/HospitalContext.jsx';
import { findShortestRoute, buildLocalizedSteps } from '../utils/pathfinding.js';
import { formatStr } from '../i18n/index.js';
import {
  playTurnCloseAlert,
  playTokenCalledChime,
  speakText,
  requestNotificationPermission,
  sendBrowserNotification,
} from '../utils/sound.js';

export function MyTurnPage() {
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const { dict, lang, prefs, updatePrefs, getPatientDetails } = useHospital();
  const details = getPatientDetails(token);
  const t = dict.turn;

  const [notifPerm, setNotifPerm] = useState(() =>
    typeof window !== 'undefined' && 'Notification' in window
      ? window.Notification.permission
      : 'unsupported'
  );
  const [simulatedSmsShown, setSimulatedSmsShown] = useState(false);
  const [showDirectionsManual, setShowDirectionsManual] = useState(
    () => searchParams.get('showWay') === '1'
  );
  const [mapFloor, setMapFloor] = useState(1);

  const alertedCloseRef = useRef(false);
  const alertedCalledRef = useRef(false);

  useEffect(() => {
    if (details?.patient?.token) {
      const tk = details.patient.token;
      if (!prefs.myTokens?.includes(tk)) {
        updatePrefs((prev) => ({
          myTokens: [tk, ...(prev.myTokens || []).filter((x) => x !== tk)].slice(0, 8),
        }));
      }
    }
  }, [details?.patient?.token]);

  useEffect(() => {
    if (!details) return;
    const { patient, dept, peopleAhead } = details;
    const floorLabel = dict.floors[dept.floor];

    if (patient.status === 'waiting' && peopleAhead > 0 && peopleAhead <= 3) {
      setSimulatedSmsShown(true);
      if (!alertedCloseRef.current) {
        alertedCloseRef.current = true;
        playTurnCloseAlert();
        const smsText = formatStr(t.smsMessage, {
          room: dept.roomNumber,
          floor: floorLabel,
          token: patient.token,
        });
        sendBrowserNotification(dict.appName, smsText, `close-${patient.token}`);
        speakText(
          formatStr(t.speechClose, {
            count: peopleAhead,
            room: dept.roomNumber,
            floor: floorLabel,
          }),
          lang
        );
      }
    } else if (patient.status === 'waiting' && peopleAhead > 3) {
      alertedCloseRef.current = false;
      setSimulatedSmsShown(false);
    }

    if (patient.status === 'serving' && !alertedCalledRef.current) {
      alertedCalledRef.current = true;
      playTokenCalledChime();
      const calledSpeech = formatStr(t.speechCalled, {
        token: patient.token,
        room: dept.roomNumber,
        floor: floorLabel,
      });
      sendBrowserNotification(t.calledBannerTitle, calledSpeech, `called-${patient.token}`);
      speakText(calledSpeech, lang);
    } else if (patient.status !== 'serving') {
      alertedCalledRef.current = false;
    }
  }, [details?.patient?.status, details?.peopleAhead, details?.dept?.roomNumber, lang]);

  const avoidStairs = Boolean(prefs.avoidStairs || prefs.assistedMode);

  const inlineRoute = useMemo(() => {
    if (!details) return null;
    return findShortestRoute('registration', details.dept.placeId, { avoidStairs });
  }, [details?.dept?.placeId, avoidStairs]);

  const inlineSteps = useMemo(
    () => (inlineRoute ? buildLocalizedSteps(inlineRoute, dict) : []),
    [inlineRoute, dict]
  );

  if (!details) {
    return (
      <AppShell customTitle={t.pageTitle}>
        <div className="max-w-xl mx-auto calm-card hc-card rounded-3xl p-6 text-center space-y-4">
          <Icon name="slip" className="w-12 h-12 text-civic mx-auto" />
          <h1 className="text-2xl font-extrabold text-ink">
            {formatStr(dict.slip.notFound, { token: token || '' })}
          </h1>
          <Link
            to="/have-slip"
            className="tactile-btn rounded-2xl bg-civic text-white border-civic-dark px-5 py-3.5 font-extrabold inline-flex items-center justify-center gap-2 hc-primary"
          >
            <Icon name="slip" className="w-5 h-5" />
            <span>{dict.home.btnHaveSlip}</span>
          </Link>
        </div>
      </AppShell>
    );
  }

  const { patient, dept, summary, peopleAhead, aheadText, waitText } = details;
  const floorLabel = dict.floors[dept.floor];
  const roomLandmark = dict.places[dept.placeId]?.landmark || '';

  const docStatusText =
    summary.doctorStatus === 'break'
      ? formatStr(t.statusBreak, { time: summary.breakUntil })
      : summary.doctorStatus === 'late'
      ? formatStr(t.statusLate, { mins: summary.lateMinutes })
      : t.statusAvailable;

  const pageSpeech =
    patient.status === 'serving'
      ? formatStr(t.speechCalled, {
          token: patient.token,
          room: dept.roomNumber,
          floor: floorLabel,
        })
      : formatStr(t.speechStatus, {
          token: patient.token,
          aheadText,
          waitText,
          serving: summary.servingPatient?.token || t.servingNone,
          docStatus: docStatusText,
        });

  const handleEnableBrowserNotifications = async () => {
    const res = await requestNotificationPermission();
    setNotifPerm(res);
  };

  const isCalled = patient.status === 'serving';
  const isClose = patient.status === 'waiting' && peopleAhead <= 3;
  const directionsVisible = isCalled || isClose || showDirectionsManual;

  return (
    <AppShell pageReadText={pageSpeech} customTitle={t.pageTitle}>
      <div className="max-w-xl mx-auto space-y-4">
        {/* ==================== SIMULATED SMS NOTIFICATION (When <= 3 Ahead) ==================== */}
        {simulatedSmsShown && patient.status === 'waiting' && (
          <div
            role="status"
            aria-live="polite"
            className="rounded-2xl border border-civic bg-civic text-white p-4 shadow-md space-y-1"
          >
            <div className="flex items-center justify-between gap-2 text-xs font-bold uppercase tracking-wider text-civic-tile">
              <span className="flex items-center gap-1.5">
                <Icon name="phone" className="w-4 h-4" />
                {t.smsHeader}
              </span>
              {patient.mobile ? <span>{patient.mobile}</span> : null}
            </div>
            <p className="text-base font-extrabold leading-snug">
              {formatStr(t.smsMessage, {
                room: dept.roomNumber,
                floor: floorLabel,
                token: patient.token,
              })}
            </p>
          </div>
        )}

        {/* ==================== MAIN QUEUE COMPANION CARD (Matches Screen 10 of Reference Design) ==================== */}
        <section className="calm-card hc-card rounded-3xl p-5 sm:p-6 space-y-5">
          {/* Top Queue Status Banner (Coral blush when close, Deep Forest when called, Soft Sage when waiting) */}
          {isCalled ? (
            <div
              role="alert"
              aria-live="assertive"
              className="rounded-2xl bg-civic text-white p-4 sm:p-5 space-y-2 hc-primary"
            >
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-full bg-white text-civic flex items-center justify-center shrink-0">
                  <Icon name="check" className="w-6 h-6" />
                </span>
                <div>
                  <h1 className="text-xl sm:text-2xl font-extrabold leading-tight">
                    {t.calledBannerTitle}
                  </h1>
                  <p className="text-sm font-medium opacity-95 mt-0.5">
                    {formatStr(t.calledBannerSub, {
                      token: patient.token,
                      room: dept.roomNumber,
                      floor: floorLabel,
                    })}
                  </p>
                </div>
              </div>
            </div>
          ) : isClose ? (
            <div
              role="alert"
              className="rounded-2xl bg-coral-tile/60 border border-coral-badge/40 p-4 flex items-start gap-3 hc-card"
            >
              <span className="w-9 h-9 rounded-full bg-coral-badge text-white flex items-center justify-center shrink-0 mt-0.5">
                <Icon name="clock" className="w-5 h-5" />
              </span>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-extrabold text-coral-ink leading-tight">
                  {peopleAhead === 0
                    ? dict.common.peopleAheadZero
                    : formatStr(t.closeBannerTitle, { count: peopleAhead })}
                </h1>
                <p className="text-sm font-semibold text-coral-ink/85 hc-muted mt-0.5">
                  {aheadText} • {waitText}
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl bg-civic-light/70 border border-civic-border p-4 flex items-start gap-3 hc-card">
              <span className="w-9 h-9 rounded-full bg-civic-mid text-white flex items-center justify-center shrink-0 mt-0.5">
                <Icon name="clock" className="w-5 h-5" />
              </span>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-extrabold text-ink leading-tight">
                  {aheadText}
                </h1>
                <p className="text-sm font-semibold text-ink-muted hc-muted mt-0.5">
                  {waitText} • {formatStr(dict.slip.roomText, { room: dept.roomNumber })} ({floorLabel})
                </p>
              </div>
            </div>
          )}

          {/* 2-Column Token | Now Serving Strip matching Screen 10 */}
          <div className="grid grid-cols-2 gap-3 pb-4 border-b border-paper-border">
            <div>
              <p className="text-xs sm:text-sm font-bold text-ink-muted hc-muted">
                {dict.slip.tokenLabel}
              </p>
              <p className="font-mono text-2xl sm:text-3xl font-black text-ink mt-0.5">
                {patient.token}
              </p>
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-ink-muted hc-muted">
                {t.servingNowLabel}
              </p>
              <p className="font-mono text-2xl sm:text-3xl font-extrabold text-ink mt-0.5">
                {summary.servingPatient ? summary.servingPatient.token : t.servingNone}
              </p>
            </div>
          </div>

          {/* Doctor Status Card with Green/Amber Indicator Dot matching Screen 10 */}
          <div className="space-y-1.5">
            <p className="text-xs sm:text-sm font-bold text-ink-muted hc-muted">
              {t.doctorStatusLabel}
            </p>
            <div className="rounded-2xl bg-paper/75 border border-paper-border p-3.5 flex items-center gap-3 hc-card">
              <span
                aria-hidden="true"
                className={`w-3.5 h-3.5 rounded-full shrink-0 ${
                  summary.doctorStatus === 'available'
                    ? 'bg-civic-mid ring-4 ring-civic-light'
                    : 'bg-ochre ring-4 ring-ochre-light'
                }`}
              />
              <div className="min-w-0">
                <p className="font-extrabold text-base text-ink leading-snug">{docStatusText}</p>
                <p className="text-sm text-ink-muted hc-muted">
                  {dept.doctor[lang] || dept.doctor.en}
                </p>
              </div>
            </div>
          </div>

          {/* What To Do Next Card matching Screen 10 */}
          <div className="space-y-1.5">
            <h2 className="text-sm sm:text-base font-extrabold text-ink">{t.whatNextTitle}</h2>
            <div className="rounded-2xl bg-paper/75 border border-paper-border p-3.5 flex items-start gap-3 hc-card">
              <div className="w-10 h-10 rounded-full bg-civic-light text-civic flex items-center justify-center shrink-0">
                <Icon name="person" className="w-5 h-5" />
              </div>
              <p className="text-sm sm:text-base font-medium text-ink leading-relaxed">
                {patient.status === 'serving'
                  ? formatStr(t.nextWhenCalled, { room: dept.roomNumber, floor: floorLabel })
                  : patient.status === 'noshow'
                  ? formatStr(t.nextWhenNoShow, { room: dept.roomNumber })
                  : patient.status === 'completed'
                  ? t.nextWhenDone
                  : isClose
                  ? formatStr(t.nextWhenClose, { room: dept.roomNumber, landmark: roomLandmark })
                  : t.nextWhenWaiting}
              </p>
            </div>
          </div>

          {notifPerm === 'default' && (
            <button
              type="button"
              onClick={handleEnableBrowserNotifications}
              className="tactile-btn w-full rounded-2xl bg-paper-warm hover:bg-civic-light text-ink border-paper-border px-4 py-3 font-bold text-sm sm:text-base flex items-center justify-center gap-2 hc-card"
            >
              <Icon name="speaker" className="w-5 h-5 text-civic-mid" />
              <span>{t.enableAlertsBtn}</span>
            </button>
          )}
        </section>

        {/* ==================== EMBEDDED DIRECTIONS & BLUEPRINT FLOOR MAP ==================== */}
        {inlineRoute && (
          <section className="calm-card hc-card rounded-3xl p-4 sm:p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-extrabold text-ink flex items-center gap-2">
                <Icon name="pin" className="w-5 h-5 text-civic-mid" />
                <span>{formatStr(t.showDirectionsInline, { room: dept.roomNumber })}</span>
              </h2>
              <div className="flex flex-wrap items-center gap-2">
                {directionsVisible && (
                  <button
                    type="button"
                    onClick={() =>
                      speakText(inlineSteps.map((s) => `${s.index}: ${s.text}`).join(' '), lang)
                    }
                    className="tactile-btn px-3.5 py-2 rounded-xl bg-civic-mid text-white border-civic font-bold text-sm flex items-center gap-1.5 hc-primary"
                  >
                    <Icon name="speaker" className="w-4 h-4" />
                    <span>{dict.wayfinding.listenAllBtn}</span>
                  </button>
                )}
                {!isCalled && !isClose && (
                  <button
                    type="button"
                    onClick={() => setShowDirectionsManual((prev) => !prev)}
                    className="tactile-btn px-3.5 py-2 rounded-xl bg-paper-warm text-ink border-paper-border font-bold text-sm flex items-center gap-1.5 hc-card"
                  >
                    <Icon name={directionsVisible ? 'close' : 'map'} className="w-4 h-4" />
                    <span>
                      {directionsVisible
                        ? t.hideDirectionsInline
                        : formatStr(t.showDirectionsInline, { room: dept.roomNumber })}
                    </span>
                  </button>
                )}
              </div>
            </div>

            {directionsVisible && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  {[0, dept.floor].map((fl) => (
                    <button
                      key={fl}
                      type="button"
                      onClick={() => setMapFloor(fl)}
                      className={`tactile-btn px-3 py-2 rounded-xl font-bold text-sm flex items-center justify-center gap-1.5 ${
                        mapFloor === fl
                          ? 'bg-civic text-white border-civic-dark hc-primary'
                          : 'bg-paper text-ink border-paper-border hc-card'
                      }`}
                    >
                      <Icon name="map" className="w-4 h-4" />
                      <span>{dict.floors[fl]}</span>
                    </button>
                  ))}
                </div>
                <FloorPlanSvg floor={mapFloor} route={inlineRoute} />
                <ol className="space-y-2.5">
                  {inlineSteps.map((st) => (
                    <li
                      key={st.index}
                      className="rounded-2xl border border-paper-border bg-paper/60 px-3.5 py-3 flex items-start gap-3 hc-card"
                    >
                      <span className="w-8 h-8 rounded-full bg-civic text-white font-extrabold text-sm flex items-center justify-center shrink-0 mt-0.5">
                        {st.index}
                      </span>
                      <span className="font-semibold text-sm sm:text-base text-ink leading-snug">
                        {st.text}
                      </span>
                    </li>
                  ))}
                </ol>
              </>
            )}
          </section>
        )}

        {/* Quick Wayfinding & Slip Action Row */}
        <section className="grid grid-cols-2 gap-2.5">
          <Link
            to={`/find?from=registration&to=${dept.placeId}&token=${patient.token}`}
            className="tactile-btn rounded-2xl bg-civic hover:bg-civic-dark text-white border-civic-dark px-3.5 py-3 font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 hc-primary"
          >
            <Icon name="pin" className="w-5 h-5" />
            <span>{formatStr(t.directionsBtn, { room: dept.roomNumber })}</span>
          </Link>

          <Link
            to={`/slip/${patient.token}`}
            className="tactile-btn rounded-2xl bg-paper-card hover:bg-paper-warm text-ink border-paper-strong px-3.5 py-3 font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 hc-card"
          >
            <Icon name="slip" className="w-5 h-5 text-civic-mid" />
            <span>{t.viewSlipBtn}</span>
          </Link>

          <Link
            to="/find?from=waiting_a&to=water_g"
            className="tactile-btn rounded-2xl bg-paper-card hover:bg-paper-warm text-ink border-paper-border px-3 py-2.5 font-bold text-sm flex items-center justify-center gap-1.5 hc-card"
          >
            <Icon name="water" className="w-4 h-4 text-civic-mid" />
            <span>{t.findWaterBtn}</span>
          </Link>

          <Link
            to="/find?from=waiting_a&to=toilets_1"
            className="tactile-btn rounded-2xl bg-paper-card hover:bg-paper-warm text-ink border-paper-border px-3 py-2.5 font-bold text-sm flex items-center justify-center gap-1.5 hc-card"
          >
            <Icon name="toilet" className="w-4 h-4 text-civic-mid" />
            <span>{t.findToiletBtn}</span>
          </Link>
        </section>
      </div>
    </AppShell>
  );
}
