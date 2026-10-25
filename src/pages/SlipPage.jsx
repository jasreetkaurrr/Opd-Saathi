import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AppShell } from '../components/AppShell.jsx';
import { Icon } from '../components/Icons.jsx';
import { QrCodeSvg } from '../components/QrCodeSvg.jsx';
import { GlossaryNote } from '../components/GlossaryNote.jsx';
import { useHospital } from '../context/HospitalContext.jsx';
import { DICTIONARIES, formatStr } from '../i18n/index.js';
import { speakText } from '../utils/sound.js';
import { downloadSlipAsPng } from '../utils/slipExport.js';

export function SlipPage() {
  const { token } = useParams();
  const { dict, lang, prefs, getPatientDetails } = useHospital();
  const [savedNotice, setSavedNotice] = useState(false);
  const [showLargeModal, setShowLargeModal] = useState(false);

  const details = getPatientDetails(token);
  const s = dict.slip;

  const qrUrl =
    typeof window !== 'undefined' && details
      ? `${window.location.origin}/turn/${details.patient.token}`
      : `OPD:${token || ''}`;

  const slipSpeech = details
    ? formatStr(s.speechTemplate, {
        name: details.patient.firstName,
        token: details.patient.token,
        dept: dict.departments[details.dept.id]?.shortName || '',
        room: details.dept.roomNumber,
        floor: dict.floors[details.dept.floor],
        doctor: details.dept.doctor[lang] || details.dept.doctor.en,
        ahead: details.peopleAhead,
        wait: details.waitText,
      })
    : s.notFound;

  useEffect(() => {
    if (details && (prefs.readAloud || prefs.assistedMode)) {
      speakText(slipSpeech, lang);
    }
  }, [details?.patient?.token, prefs.readAloud, prefs.assistedMode, lang, slipSpeech]);

  if (!details) {
    return (
      <AppShell>
        <div className="max-w-xl mx-auto calm-card hc-card rounded-3xl p-6 text-center space-y-4">
          <Icon name="slip" className="w-12 h-12 text-civic mx-auto" />
          <h1 className="text-2xl font-extrabold text-ink">
            {formatStr(s.notFound, { token: token || '' })}
          </h1>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link
              to="/have-slip"
              className="tactile-btn rounded-2xl bg-civic text-white border-civic-dark px-5 py-3.5 font-extrabold flex items-center justify-center gap-2 hc-primary"
            >
              <Icon name="slip" className="w-5 h-5" />
              <span>{dict.home.btnHaveSlip}</span>
            </Link>
            <Link
              to="/register"
              className="tactile-btn rounded-2xl bg-paper-warm text-ink border-paper-strong px-5 py-3.5 font-extrabold flex items-center justify-center gap-2"
            >
              <Icon name="person" className="w-5 h-5" />
              <span>{dict.home.btnRegister}</span>
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  const { patient, dept, peopleAhead, aheadText, waitText } = details;
  const deptName = dict.departments[dept.id]?.shortName || dept.id;
  const roomText = formatStr(s.roomText, { room: dept.roomNumber });
  const floorText = dict.floors[dept.floor];
  const doctorName = dept.doctor[lang] || dept.doctor.en;
  const landmarkText = dict.places[dept.placeId]?.landmark || '';

  const handleSaveAsImage = () => {
    downloadSlipAsPng({
      hospitalName: dict.hospitalName,
      slipHeader: s.slipHeader,
      token: patient.token,
      firstName: patient.firstName,
      departmentName: deptName,
      roomText,
      floorText,
      doctorName,
      opdHours: dept.opdHours,
      aheadText,
      waitText,
      qrUrl,
      qrCaption: s.qrCaption,
      labels: {
        firstName: s.firstNameLabel,
        department: s.departmentLabel,
        roomFloor: s.roomFloorLabel,
        doctor: s.doctorLabel,
        queueStatus: s.queueStatusLabel,
      },
    });
    setSavedNotice(true);
    window.setTimeout(() => setSavedNotice(false), 3500);
  };

  return (
    <AppShell pageReadText={slipSpeech}>
      <div className="max-w-xl mx-auto space-y-4">
        {/* Heading + Mint Confirmation Banner (Matches Screen 5 of Reference Design) */}
        <div className="no-print space-y-3">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink">{s.pageTitle}</h1>
          <div className="rounded-2xl bg-civic-light border border-civic-border px-4 py-3 flex items-center gap-3 hc-card">
            <span className="w-8 h-8 rounded-full bg-civic-mid text-white flex items-center justify-center shrink-0">
              <Icon name="check" className="w-4 h-4" />
            </span>
            <span className="font-extrabold text-base text-civic">{s.completeBanner}</span>
          </div>
        </div>

        {/* ==================== CLEAN HAIRLINE-DIVIDED OPD SLIP CARD ==================== */}
        <article
          aria-label={s.slipHeader}
          className="printable-slip calm-card hc-card rounded-3xl bg-white p-5 sm:p-6 space-y-4"
        >
          {/* Print-only hospital header */}
          <div className="pb-3 border-b border-paper-border flex items-center justify-between gap-2">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-civic-mid">
                {dict.hospitalName}
              </p>
              <p className="text-sm font-bold text-ink-muted hc-muted">
                {s.firstNameLabel}: <span className="text-ink font-extrabold">{patient.firstName}</span>
              </p>
            </div>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-paper-warm text-ink-muted hc-muted">
              {dept.opdHours}
            </span>
          </div>

          <dl className="divide-y divide-paper-border">
            {/* Row 1: Token */}
            <div className="py-3 first:pt-0">
              <dt className="text-xs sm:text-sm font-bold text-ink-muted hc-muted">{s.tokenLabel}</dt>
              <dd className="mt-1 flex items-center gap-2.5">
                <Icon name="ticket" className="w-6 h-6 text-civic-mid" />
                <span className="font-mono text-3xl sm:text-4xl font-black tracking-tight text-ink">
                  {patient.token}
                </span>
              </dd>
            </div>

            {/* Row 2: Department */}
            <div className="py-3">
              <dt className="text-xs sm:text-sm font-bold text-ink-muted hc-muted">
                {s.departmentLabel}
              </dt>
              <dd className="mt-1 flex items-center gap-2.5">
                <Icon name="building" className="w-5 h-5 text-civic-mid" />
                <span className="text-lg sm:text-xl font-extrabold text-ink">{deptName}</span>
              </dd>
            </div>

            {/* Row 3: Room & Floor */}
            <div className="py-3">
              <dt className="text-xs sm:text-sm font-bold text-ink-muted hc-muted">
                {s.roomFloorLabel}
              </dt>
              <dd className="mt-1">
                <div className="flex items-center gap-2.5">
                  <Icon name="door" className="w-5 h-5 text-civic-mid" />
                  <span className="text-lg sm:text-xl font-extrabold text-ink">
                    {roomText} ({floorText})
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-ink-muted hc-muted mt-1 pl-7">
                  {landmarkText}
                </p>
              </dd>
            </div>

            {/* Row 4: Doctor */}
            <div className="py-3">
              <dt className="text-xs sm:text-sm font-bold text-ink-muted hc-muted">{s.doctorLabel}</dt>
              <dd className="mt-1 flex items-center gap-2.5">
                <Icon name="med" className="w-5 h-5 text-civic-mid" />
                <span className="text-base sm:text-lg font-extrabold text-ink">{doctorName}</span>
              </dd>
            </div>

            {/* Row 5: 2-Column People Ahead & Est. Wait Time */}
            <div className="py-3 grid grid-cols-2 gap-3">
              <div>
                <dt className="text-xs sm:text-sm font-bold text-ink-muted hc-muted">
                  {s.peopleAheadLabel}
                </dt>
                <dd className="text-xl sm:text-2xl font-extrabold text-ink mt-0.5">
                  {peopleAhead}
                </dd>
              </div>
              <div>
                <dt className="text-xs sm:text-sm font-bold text-ink-muted hc-muted">
                  {s.estimatedWaitLabel}
                </dt>
                <dd className="text-base sm:text-lg font-extrabold text-ink mt-1 leading-snug">
                  {waitText}
                </dd>
              </div>
            </div>

            {/* Row 6: QR Code + Scan Caption */}
            <div className="pt-4 flex items-center gap-4">
              <QrCodeSvg
                value={qrUrl}
                size={112}
                label={formatStr(s.qrAriaLabel, { token: patient.token })}
              />
              <div className="min-w-0 flex-1 space-y-1">
                <p className="font-bold text-sm sm:text-base text-ink leading-snug">
                  {s.qrCaption}
                </p>
                <p className="text-xs text-ink-muted hc-muted">{aheadText}</p>
              </div>
            </div>
          </dl>

          {/* 4 Slip Action Pills inside Card (Save Image, Print, Read Aloud, Large Type) */}
          <div className="no-print pt-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={handleSaveAsImage}
              className="tactile-btn rounded-xl bg-paper hover:bg-paper-warm text-ink border-paper-border px-2.5 py-2 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 hc-card"
            >
              <Icon name="download" className="w-4 h-4 text-civic-mid" />
              <span>{s.saveImageBtn}</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="tactile-btn rounded-xl bg-paper hover:bg-paper-warm text-ink border-paper-border px-2.5 py-2 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 hc-card"
            >
              <Icon name="print" className="w-4 h-4 text-civic-mid" />
              <span>{s.printBtn}</span>
            </button>

            <button
              type="button"
              onClick={() => speakText(slipSpeech, lang)}
              className="tactile-btn rounded-xl bg-paper hover:bg-paper-warm text-ink border-paper-border px-2.5 py-2 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 hc-card"
            >
              <Icon name="speaker" className="w-4 h-4 text-civic-mid" />
              <span>{s.readSlipBtn}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowLargeModal(true)}
              className="tactile-btn rounded-xl bg-paper hover:bg-paper-warm text-ink border-paper-border px-2.5 py-2 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 hc-card"
            >
              <Icon name="expand" className="w-4 h-4 text-civic-mid" />
              <span>{s.showLargeBtn}</span>
            </button>
          </div>
        </article>

        {/* Keep This Slip With You Note */}
        <p className="no-print flex items-center justify-center gap-2 text-sm font-medium text-ink-muted hc-muted">
          <Icon name="heartHands" className="w-4 h-4 text-civic-mid" />
          <span>{s.keepSlipNote}</span>
        </p>

        {savedNotice && (
          <div
            role="status"
            className="no-print rounded-2xl bg-civic text-white px-4 py-3 font-bold text-center"
          >
            {s.savedToast}
          </div>
        )}

        {/* Primary Next-Step Journey Buttons */}
        <section className="no-print space-y-2.5">
          <Link
            to={`/find?from=registration&to=${dept.placeId}&token=${patient.token}`}
            className="tactile-btn w-full rounded-2xl bg-civic hover:bg-civic-dark text-white border-civic-dark px-5 py-3.5 font-extrabold text-lg flex items-center justify-center gap-2.5 hc-primary"
          >
            <Icon name="pin" className="w-5 h-5" />
            <span>{formatStr(s.primaryWayBtn, { room: dept.roomNumber })}</span>
            <Icon name="next" className="w-5 h-5" />
          </Link>

          <Link
            to={`/turn/${patient.token}`}
            className="tactile-btn w-full rounded-2xl bg-paper-card hover:bg-civic-light text-ink border-paper-strong px-5 py-3.5 font-extrabold text-base flex items-center justify-center gap-2 hc-card"
          >
            <Icon name="clock" className="w-5 h-5 text-civic" />
            <span>{s.secondaryTurnBtn}</span>
          </Link>
        </section>

        <div className="no-print">
          <GlossaryNote term="token" />
        </div>
      </div>

      {/* Full-Screen Large Type Card to Show Any Staff Member (Bilingual Hindi + English) */}
      {showLargeModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={s.largeModalTitle}
          className="fixed inset-0 z-50 bg-ink/80 backdrop-blur-sm flex items-center justify-center p-3 overflow-y-auto"
        >
          <div className="calm-card hc-card border-2 border-civic rounded-3xl max-w-xl w-full p-6 space-y-5 text-center my-auto">
            <p className="text-sm font-extrabold uppercase tracking-wide text-civic">
              {s.largeModalTitle}
            </p>

            <div className="rounded-2xl bg-civic text-white py-5 px-4">
              <p className="font-mono text-5xl sm:text-6xl font-black tracking-wider">
                {patient.token}
              </p>
              <p className="text-xl font-bold mt-2">{patient.firstName}</p>
            </div>

            <div className="rounded-2xl border border-paper-border bg-civic-light/70 p-4 space-y-2 text-ink">
              <p className="text-sm font-bold">{s.largePleaseGuide}</p>
              <p className="text-2xl sm:text-3xl font-extrabold">
                {formatStr(DICTIONARIES.en.slip.roomText, { room: dept.roomNumber })} •{' '}
                {DICTIONARIES.en.floors[dept.floor]}
              </p>
              <p className="text-xl sm:text-2xl font-extrabold text-civic">
                {formatStr(DICTIONARIES.hi.slip.roomText, { room: dept.roomNumber })} •{' '}
                {DICTIONARIES.hi.floors[dept.floor]}
              </p>
              <p className="text-base font-bold pt-1 text-ink-muted">
                {DICTIONARIES.en.departments[dept.id]?.shortName} /{' '}
                {DICTIONARIES.hi.departments[dept.id]?.shortName}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowLargeModal(false)}
              className="tactile-btn w-full rounded-2xl bg-civic text-white border-civic-dark px-5 py-3.5 font-extrabold text-lg flex items-center justify-center gap-2 hc-primary"
            >
              <Icon name="close" className="w-5 h-5" />
              <span>{dict.common.close}</span>
            </button>
          </div>
        </div>
      )}
    </AppShell>
  );
}
