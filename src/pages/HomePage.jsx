import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppShell, useUrgentHelpTrigger } from '../components/AppShell.jsx';
import { Icon } from '../components/Icons.jsx';
import { GlossaryNote } from '../components/GlossaryNote.jsx';
import { CompanionPortraitSvg } from '../components/HospitalIllustrations.jsx';
import { useHospital } from '../context/HospitalContext.jsx';
import { formatStr } from '../i18n/index.js';
import { speakText } from '../utils/sound.js';

export function HomePage() {
  const { dict, lang, prefs, updatePrefs, activeSavedTokens, getPatientDetails } = useHospital();
  const navigate = useNavigate();
  const triggerUrgentHelp = useUrgentHelpTrigger();

  const activeTicket = activeSavedTokens[0] ? getPatientDetails(activeSavedTokens[0]) : null;

  const pageSpeech = `${dict.home.welcomePrefix} ${dict.hospitalName}. ${dict.home.reassurance} 1: ${dict.home.btnRegister}. 2: ${dict.home.btnHaveSlip}. 3: ${dict.home.btnFindPlace}. 4: ${dict.home.btnEmergency}.`;

  useEffect(() => {
    if (prefs.readAloud && prefs.langChosen) {
      speakText(pageSpeech, lang);
    }
  }, [prefs.readAloud, prefs.langChosen, lang, pageSpeech]);

  const handleActivateKamlaPersona = () => {
    updatePrefs({
      lang: 'hi',
      langChosen: true,
      textSize: 'large',
      avoidStairs: true,
      readAloud: true,
      assistedMode: false,
    });
    navigate('/register?persona=kamla');
  };

  return (
    <AppShell pageReadText={pageSpeech}>
      <div className="max-w-2xl lg:max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-7 space-y-5 min-w-0">
          {/* ==================== MAIN HERO COMPANION CARD (Matches Screen 1 of Reference Design) ==================== */}
          <section className="calm-card hc-card rounded-3xl p-4 sm:p-6 space-y-4">
          {/* Welcome Heading */}
          <div>
            <p className="text-lg sm:text-xl font-semibold text-ink-muted hc-muted leading-snug">
              {dict.home.welcomePrefix}
            </p>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight leading-tight">
              {dict.hospitalName}
            </h1>
            <p className="text-base text-ink-muted hc-muted mt-1.5 leading-snug">
              {dict.home.reassurance}
            </p>
          </div>

          {/* Realistic-style hospital exterior photo */}
          <img
            src="/hospital.jpg"
            alt={`${dict.hospitalName} entrance`}
            className="block w-full h-40 sm:h-48 object-cover object-center rounded-2xl border border-paper-border"
            loading="eager"
          />

          {/* 2x2 Soft Pastel Action Grid (Register, I have my slip, Find a place, Emergency) */}
          <div aria-label={dict.a11y.mainActions} className="grid grid-cols-2 gap-3 sm:gap-3.5">
            {/* 1. Register (Soft Sage Mint) */}
            <Link
              to="/register"
              className="tactile-btn rounded-2xl bg-civic-tile hover:bg-[#B2CFC1] border-[#9EC1B0] p-3.5 sm:p-5 flex flex-col items-center text-center justify-center gap-2 min-w-0 hc-primary"
            >
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-civic-mid text-white flex items-center justify-center shadow-sm shrink-0">
                <Icon name="person" className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <div className="min-w-0">
                <span className="block text-lg sm:text-xl font-extrabold text-ink leading-tight">
                  {dict.home.btnRegister}
                </span>
                <span className="block text-xs sm:text-sm font-medium text-ink-muted mt-0.5 leading-snug">
                  {dict.home.btnRegisterSub}
                </span>
              </div>
            </Link>

            {/* 2. I have my slip (Soft Sky Blue) */}
            <Link
              to="/have-slip"
              className="tactile-btn rounded-2xl bg-sky-tile hover:bg-[#B8D1EA] border-[#A3C2E0] p-3.5 sm:p-5 flex flex-col items-center text-center justify-center gap-2 min-w-0 hc-card"
            >
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-sky-badge text-white flex items-center justify-center shadow-sm shrink-0">
                <Icon name="slip" className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <div className="min-w-0">
                <span className="block text-lg sm:text-xl font-extrabold text-ink leading-tight">
                  {dict.home.btnHaveSlip}
                </span>
                <span className="block text-xs sm:text-sm font-medium text-ink-muted hc-muted mt-0.5 leading-snug">
                  {dict.home.btnHaveSlipSub}
                </span>
              </div>
            </Link>

            {/* 3. Find a place (Soft Lavender) */}
            <Link
              to="/find"
              className="tactile-btn rounded-2xl bg-lavender-tile hover:bg-[#CCC3E4] border-[#B8ADD6] p-3.5 sm:p-5 flex flex-col items-center text-center justify-center gap-2 min-w-0 hc-card"
            >
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-lavender-badge text-white flex items-center justify-center shadow-sm shrink-0">
                <Icon name="pin" className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <div className="min-w-0">
                <span className="block text-lg sm:text-xl font-extrabold text-ink leading-tight">
                  {dict.home.btnFindPlace}
                </span>
                <span className="block text-xs sm:text-sm font-medium text-ink-muted hc-muted mt-0.5 leading-snug">
                  {dict.home.btnFindPlaceSub}
                </span>
              </div>
            </Link>

            {/* 4. Emergency (Soft Warm Terracotta Coral) */}
            <Link
              to="/emergency"
              className="tactile-btn rounded-2xl bg-coral-tile hover:bg-[#EBB4AF] border-[#DFA09A] p-3.5 sm:p-5 flex flex-col items-center text-center justify-center gap-2 min-w-0 hc-card"
            >
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-coral-badge text-white flex items-center justify-center shadow-sm shrink-0">
                <Icon name="urgent" className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <div className="min-w-0">
                <span className="block text-lg sm:text-xl font-extrabold text-coral-ink leading-tight">
                  {dict.home.btnEmergency}
                </span>
                <span className="block text-xs sm:text-sm font-medium text-coral-ink/85 hc-muted mt-0.5 leading-snug">
                  {dict.home.btnEmergencySub}
                </span>
              </div>
            </Link>
          </div>

          {/* Full-Width "I need urgent help" Pill Strip directly below the 2x2 Grid */}
          <button
            type="button"
            onClick={triggerUrgentHelp}
            className="tactile-btn w-full rounded-2xl bg-paper-warm hover:bg-coral-light text-ink border-paper-border px-4 py-3 font-bold text-base flex items-center justify-center gap-2.5 hc-card"
          >
            <Icon name="flag" className="w-5 h-5 text-civic" />
            <span>{dict.common.urgentHelp}</span>
          </button>

          {/* Bottom Utility Links Row (Settings & Help Desk) */}
          <div className="pt-1 border-t border-paper-border flex items-center justify-between gap-2">
            <Link
              to="/settings"
              className="tactile-btn border-transparent shadow-none hover:bg-paper-warm rounded-xl px-3 py-2 text-sm font-bold text-ink-muted hc-muted flex items-center gap-1.5"
            >
              <Icon name="settings" className="w-4 h-4" />
              <span>{dict.common.settings}</span>
            </Link>
            <Link
              to="/find?to=help_desk"
              className="tactile-btn border-transparent shadow-none hover:bg-paper-warm rounded-xl px-3 py-2 text-sm font-bold text-ink-muted hc-muted flex items-center gap-1.5"
            >
              <Icon name="help" className="w-4 h-4" />
              <span>{dict.bottomNav.help}</span>
            </Link>
          </div>
        </section>

        {/* Active Slip Return Banner (when patient already registered on this phone) */}
        {activeTicket && (
          <section
            aria-label={dict.home.activeTokenBanner}
            className="calm-card hc-card rounded-3xl border-2 border-civic-border bg-civic-light/70 p-4 sm:p-5 space-y-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs sm:text-sm font-extrabold uppercase tracking-wide text-civic">
                  {dict.home.activeTokenBanner}
                </p>
                <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5 mt-0.5">
                  <span className="font-mono text-2xl font-black text-ink">
                    {activeTicket.patient.token}
                  </span>
                  <span className="font-bold text-base text-ink">
                    • {activeTicket.patient.firstName} •{' '}
                    {formatStr(dict.slip.roomText, { room: activeTicket.dept.roomNumber })}
                  </span>
                </div>
                <p className="text-sm font-medium text-ink-muted hc-muted mt-0.5">
                  {activeTicket.aheadText} • {activeTicket.waitText}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <Link
                to={`/turn/${activeTicket.patient.token}`}
                className="tactile-btn rounded-2xl bg-civic hover:bg-civic-dark text-white border-civic-dark px-4 py-2.5 font-extrabold flex items-center justify-center gap-2 text-base hc-primary"
              >
                <Icon name="clock" className="w-5 h-5" />
                <span>{dict.home.viewMyTurn}</span>
              </Link>
              <Link
                to={`/find?from=registration&to=${activeTicket.dept.placeId}&token=${activeTicket.patient.token}`}
                className="tactile-btn rounded-2xl bg-paper-card hover:bg-paper-warm text-civic border-civic-border px-4 py-2.5 font-extrabold flex items-center justify-center gap-2 text-base hc-card"
              >
                <Icon name="pin" className="w-5 h-5" />
                <span>
                  {formatStr(dict.home.wayToRoom, { room: activeTicket.dept.roomNumber })}
                </span>
              </Link>
            </div>
          </section>
        )}

        {/* Plain-Language First-Appearance Explanation of OPD */}
        </div>

        <div className="lg:col-span-5 space-y-5 min-w-0">
        <GlossaryNote term="opd" />

        {/* ==================== "HOW IT WORKS" 4-STEP STRIP (Matches Bottom-Center Panel of Mockup) ==================== */}
        <section className="calm-card hc-card rounded-3xl p-4 sm:p-5 space-y-4">
          <h2 className="text-lg font-extrabold text-ink">{dict.home.howItWorksTitle}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: 'person', title: dict.home.howStep1Title, sub: dict.home.howStep1Sub },
              { icon: 'slip', title: dict.home.howStep2Title, sub: dict.home.howStep2Sub },
              { icon: 'seats', title: dict.home.howStep3Title, sub: dict.home.howStep3Sub },
              { icon: 'pin', title: dict.home.howStep4Title, sub: dict.home.howStep4Sub },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl bg-paper/75 border border-paper-border p-3 flex flex-col items-center text-center gap-1.5 hc-card"
              >
                <div className="w-11 h-11 rounded-full bg-civic-light text-civic flex items-center justify-center">
                  <Icon name={item.icon} className="w-5 h-5" />
                </div>
                <p className="font-extrabold text-sm text-ink leading-snug">{item.title}</p>
                <p className="text-xs text-ink-muted hc-muted leading-snug">{item.sub}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-sm font-semibold text-ink-muted hc-muted pt-1">
            {dict.home.howFooter}
          </p>
        </section>

        {/* ==================== COMPANION PORTRAIT BANNER + KAMLA 1-TAP DEMO ==================== */}
        <section className="calm-card hc-card rounded-3xl p-4 sm:p-5 space-y-3 overflow-hidden">
          <div className="flex items-center gap-4">
            <CompanionPortraitSvg />
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-1.5 text-civic-mid">
                <Icon name="heartHands" className="w-5 h-5" />
                <span className="font-extrabold text-base text-ink">{dict.appName}</span>
              </div>
              <p className="text-xs font-bold text-ink-muted hc-muted">{dict.hospitalName}</p>
              <p className="text-sm sm:text-base font-bold text-civic leading-snug pt-0.5">
                {dict.home.companionTaglinePrimary}
              </p>
              <p className="text-xs sm:text-sm text-ink-muted hc-muted leading-snug">
                {dict.home.companionTaglineSub}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleActivateKamlaPersona}
            className="tactile-btn w-full rounded-2xl bg-civic-light hover:bg-civic-tile border-civic-border text-ink px-4 py-3 flex items-center justify-between gap-3 text-left hc-card"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-civic text-white flex items-center justify-center shrink-0">
                <Icon name="wheelchair" className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="block font-extrabold text-sm sm:text-base text-ink leading-snug">
                  {dict.home.kamlaPresetBtn}
                </span>
                <span className="block text-xs text-ink-muted hc-muted leading-snug">
                  {dict.home.kamlaPresetSub}
                </span>
              </div>
            </div>
            <Icon name="next" className="w-5 h-5 text-civic shrink-0" />
          </button>
        </section>
        </div>
      </div>
    </AppShell>
  );
}
