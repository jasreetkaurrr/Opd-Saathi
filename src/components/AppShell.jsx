import React, { createContext, useContext, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useHospital } from '../context/HospitalContext.jsx';
import { DICTIONARIES, formatStr } from '../i18n/index.js';
import { Icon } from './Icons.jsx';
import { speakText, stopSpeech, unlockAudio, vibrateDevice } from '../utils/sound.js';

const QUICK_PLACES_FOR_URGENT = [
  'entrance',
  'registration',
  'help_desk',
  'waiting_a',
  'pharmacy',
  'laboratory',
  'nurses_station',
];

const UrgentHelpContext = createContext(() => {});

export function useUrgentHelpTrigger() {
  return useContext(UrgentHelpContext);
}

export function AppShell({
  children,
  pageReadText = '',
  hideFirstVisitModal = false,
  customTitle = null,
  backTo = null,
}) {
  const {
    dict,
    lang,
    prefs,
    updatePrefs,
    raiseUrgentFlag,
    activeSavedTokens,
    getPatientDetails,
  } = useHospital();
  const location = useLocation();
  const navigate = useNavigate();

  const [urgentModalOpen, setUrgentModalOpen] = useState(false);
  const [urgentPlace, setUrgentPlace] = useState('entrance');
  const [urgentSentFlag, setUrgentSentFlag] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [pendingGateLang, setPendingGateLang] = useState(lang || 'en');

  const activeTicket = activeSavedTokens[0] ? getPatientDetails(activeSavedTokens[0]) : null;
  const isHome = location.pathname === '/';
  const isStaffRoute = location.pathname.startsWith('/staff');

  const handleToggleLanguage = () => {
    unlockAudio();
    stopSpeech();
    setIsSpeaking(false);
    updatePrefs({
      lang: lang === 'en' ? 'hi' : 'en',
      langChosen: true,
    });
  };

  const handleConfirmInitialLanguage = (chosenLang) => {
    unlockAudio();
    updatePrefs({
      lang: chosenLang || pendingGateLang,
      langChosen: true,
    });
  };

  const handleReadScreen = () => {
    unlockAudio();
    if (isSpeaking) {
      stopSpeech();
      setIsSpeaking(false);
      return;
    }
    const textToSpeak =
      pageReadText || `${dict.hospitalName}. ${dict.appName}. ${dict.home.greeting}`;
    setIsSpeaking(true);
    speakText(textToSpeak, lang, () => setIsSpeaking(false));
  };

  const handleOpenAndRaiseUrgent = () => {
    unlockAudio();
    vibrateDevice([350, 120, 350]);
    const defaultPlace = activeTicket?.dept?.placeId || 'entrance';
    setUrgentPlace(defaultPlace);
    const created = raiseUrgentFlag({
      placeId: defaultPlace,
      token: activeTicket?.patient?.token || null,
      firstName: activeTicket?.patient?.firstName || '',
    });
    setUrgentSentFlag(created);
    setUrgentModalOpen(true);
    speakText(`${dict.common.urgentHelpSentTitle}. ${dict.common.urgentHelpSentBody}`, lang);
  };

  const handleUpdateUrgentLocation = (newPlaceId) => {
    setUrgentPlace(newPlaceId);
    const created = raiseUrgentFlag({
      placeId: newPlaceId,
      token: activeTicket?.patient?.token || null,
      firstName: activeTicket?.patient?.firstName || '',
    });
    setUrgentSentFlag(created);
  };

  const showLanguageGate = !prefs.langChosen && !hideFirstVisitModal;

  const slipOrTurnPath = activeTicket
    ? `/turn/${activeTicket.patient.token}`
    : '/have-slip';

  return (
    <UrgentHelpContext.Provider value={handleOpenAndRaiseUrgent}>
      <div
        onClick={unlockAudio}
        className="hc-surface min-h-screen flex flex-col bg-paper text-ink selection:bg-civic selection:text-white"
      >
        {/* Calm Header Bar + Persistent Emergency Access on Every Screen */}
        <header className="no-print sticky top-0 z-40 bg-paper-card/95 backdrop-blur border-b border-paper-border hc-surface">
          {/* Compact Persistent Safety Bar (Always reachable on every screen) */}
          <div className="bg-coral-light/85 border-b border-coral-tile px-3 py-1.5 hc-surface">
            <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2">
              <Link
                to="/emergency"
                className="tactile-btn flex-1 min-w-[144px] bg-urgent hover:bg-urgent-dark text-white border-urgent-dark rounded-2xl px-3.5 py-2 font-extrabold flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                <Icon name="emergency" className="w-5 h-5" />
                <span>{dict.common.emergency} (112)</span>
              </Link>

              <button
                type="button"
                onClick={handleOpenAndRaiseUrgent}
                className="tactile-btn flex-1 min-w-[156px] bg-paper-card hover:bg-coral-tile/40 text-coral-ink border-coral-badge/50 rounded-2xl px-3.5 py-2 font-bold flex items-center justify-center gap-2 text-sm sm:text-base hc-card"
              >
                <Icon name="flag" className="w-5 h-5 text-urgent" />
                <span>{dict.common.urgentHelp}</span>
              </button>
            </div>
          </div>

          {/* Brand & Language / Voice Navigation Bar */}
          <nav
            aria-label={dict.a11y.primaryNav}
            className="max-w-6xl mx-auto px-3 py-2 flex flex-wrap items-center justify-between gap-2"
          >
            {isHome ? (
              <Link
                to="/"
                className="tactile-btn border-transparent shadow-none hover:bg-paper-warm px-1.5 sm:px-2 py-1.5 rounded-2xl flex items-center gap-2"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-civic-light text-civic-mid flex items-center justify-center shrink-0">
                  <Icon name="heartHands" className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="leading-tight">
                  <span className="block font-extrabold text-base sm:text-lg tracking-tight text-ink">
                    {dict.appName}
                  </span>
                  <span className="hidden sm:block text-xs font-medium text-ink-muted hc-muted">
                    {dict.brandTagline}
                  </span>
                </div>
              </Link>
            ) : (
              <Link
                to={backTo || '/'}
                className="tactile-btn bg-paper-card hover:bg-paper-warm border-paper-border px-2.5 sm:px-3 py-1.5 rounded-2xl flex items-center gap-1.5 text-ink font-bold text-sm sm:text-base hc-card"
              >
                <Icon name="back" className="w-5 h-5 text-civic" />
                <span>{customTitle || dict.appName}</span>
              </Link>
            )}

            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              {pageReadText ? (
                <button
                  type="button"
                  onClick={handleReadScreen}
                  aria-pressed={isSpeaking}
                  className={`tactile-btn px-2.5 sm:px-3 py-1.5 rounded-2xl font-bold flex items-center gap-1.5 text-sm sm:text-base ${
                    isSpeaking
                      ? 'bg-civic text-white border-civic-dark hc-primary'
                      : 'bg-paper-warm hover:bg-civic-light text-ink border-paper-border hc-card'
                  }`}
                >
                  <Icon name="speaker" className="w-4 h-4 text-civic-mid" />
                  <span>{isSpeaking ? dict.common.stopListening : dict.common.listen}</span>
                </button>
              ) : null}

              <button
                type="button"
                onClick={handleToggleLanguage}
                aria-label={formatStr(dict.a11y.switchLanguage, { lang: dict.common.switchLang })}
                className="tactile-btn px-2.5 sm:px-3 py-1.5 rounded-2xl bg-paper-card hover:bg-civic-light text-ink border-paper-strong font-bold text-sm sm:text-base flex items-center gap-1.5 hc-card"
              >
                <Icon name="globe" className="w-4 h-4 text-civic-mid" />
                <span>
                  {lang === 'en' ? 'EN | हिंदी' : 'हिंदी | EN'}
                </span>
              </button>
            </div>
          </nav>
        </header>

        {/* Main Content */}
        <main id="main-content" className="flex-1 w-full max-w-6xl mx-auto px-3 sm:px-5 py-4 sm:py-6">
          {children}
        </main>

        {/* Clean Patient Bottom Tab Bar (matching My Turn / Mobile Shell in Reference Design) */}
        {!isStaffRoute && (
          <nav
            aria-label={dict.a11y.mainActions}
            className="no-print sticky bottom-0 z-30 bg-paper-card/95 backdrop-blur border-t border-paper-border px-2 py-1.5 hc-surface"
          >
            <div className="max-w-lg mx-auto grid grid-cols-4 gap-1.5">
              {[
                { to: '/', label: dict.bottomNav.home, icon: 'home', match: location.pathname === '/' },
                {
                  to: slipOrTurnPath,
                  label: dict.bottomNav.slip,
                  icon: 'slip',
                  match:
                    location.pathname.startsWith('/slip') ||
                    location.pathname.startsWith('/turn') ||
                    location.pathname.startsWith('/have-slip'),
                },
                {
                  to: '/find',
                  label: dict.bottomNav.map,
                  icon: 'pin',
                  match: location.pathname.startsWith('/find'),
                },
                {
                  to: '/settings',
                  label: dict.bottomNav.settings,
                  icon: 'settings',
                  match: location.pathname.startsWith('/settings'),
                },
              ].map((tab) => (
                <Link
                  key={tab.to}
                  to={tab.to}
                  aria-current={tab.match ? 'page' : undefined}
                  className={`tactile-btn rounded-2xl px-2 py-1.5 flex flex-col items-center justify-center gap-0.5 text-xs sm:text-sm font-bold ${
                    tab.match
                      ? 'bg-civic-light text-civic border-civic-border hc-primary'
                      : 'bg-transparent text-ink-muted border-transparent shadow-none hover:bg-paper-warm hc-card'
                  }`}
                >
                  <Icon name={tab.icon} className="w-5 h-5" />
                  <span>{tab.label}</span>
                </Link>
              ))}
            </div>
          </nav>
        )}

        {/* Calm Demo Portal Switcher Footer */}
        <footer className="no-print border-t border-paper-border bg-paper-warm/60 py-5 px-3 hc-surface">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <p className="text-xs sm:text-sm font-medium text-ink-muted hc-muted max-w-md">
              {dict.common.sampleHospitalNote}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                to="/"
                className="tactile-btn px-3 py-2 rounded-xl bg-paper-card border-paper-border font-bold text-xs sm:text-sm text-ink flex items-center gap-1.5 hover:border-civic hc-card"
              >
                <Icon name="home" className="w-4 h-4 text-civic-mid" />
                <span>{dict.common.home}</span>
              </Link>
              <Link
                to="/staff"
                className="tactile-btn px-3 py-2 rounded-xl bg-paper-card border-paper-border font-bold text-xs sm:text-sm text-ink flex items-center gap-1.5 hover:border-civic hc-card"
              >
                <Icon name="users" className="w-4 h-4 text-civic-mid" />
                <span>{dict.common.staffPortal}</span>
              </Link>
              <Link
                to="/staff/counter"
                className="tactile-btn px-3 py-2 rounded-xl bg-paper-card border-paper-border font-bold text-xs sm:text-sm text-ink flex items-center gap-1.5 hover:border-civic hc-card"
              >
                <Icon name="slip" className="w-4 h-4 text-civic-mid" />
                <span>{dict.common.counterPortal}</span>
              </Link>
              <Link
                to="/board"
                className="tactile-btn px-3 py-2 rounded-xl bg-paper-card border-paper-border font-bold text-xs sm:text-sm text-ink flex items-center gap-1.5 hover:border-civic hc-card"
              >
                <Icon name="expand" className="w-4 h-4 text-civic-mid" />
                <span>{dict.common.tvBoard}</span>
              </Link>
            </div>
          </div>
        </footer>

        {/* ==================== FIRST-VISIT LANGUAGE PICKER (Matches Screen 2 of Reference Design) ==================== */}
        {showLanguageGate && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="lang-gate-title"
            className="fixed inset-0 z-50 bg-ink/55 backdrop-blur-sm flex items-center justify-center p-3 overflow-y-auto"
          >
            <div className="calm-card hc-card rounded-3xl max-w-md w-full p-5 sm:p-6 space-y-4 my-auto">
              {/* Top Brand Row + Emergency Button */}
              <div className="flex items-center justify-between gap-2 pb-2 border-b border-paper-border">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-civic-light text-civic-mid flex items-center justify-center">
                    <Icon name="heartHands" className="w-5 h-5" />
                  </div>
                  <span className="font-extrabold text-base text-ink">
                    {DICTIONARIES.en.appName}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    updatePrefs({ langChosen: true });
                    navigate('/emergency');
                  }}
                  className="tactile-btn bg-urgent hover:bg-urgent-dark text-white border-urgent-dark rounded-xl px-3 py-2 font-bold text-sm flex items-center gap-1.5"
                >
                  <Icon name="emergency" className="w-4 h-4" />
                  <span>{DICTIONARIES.en.languagePicker.emergencyBtn}</span>
                </button>
              </div>

              <div>
                <h1 id="lang-gate-title" className="text-2xl font-extrabold text-ink">
                  {DICTIONARIES.en.languagePicker.choosePrompt}
                </h1>
                <p className="text-sm sm:text-base text-ink-muted hc-muted mt-1">
                  {DICTIONARIES.en.languagePicker.bilingualSub}
                </p>
              </div>

              {/* Selectable Language Cards with Dark-Green Script Circle Badges */}
              <div className="space-y-2.5">
                {[
                  {
                    code: 'en',
                    scriptBadge: 'En',
                    primary: DICTIONARIES.en.languagePicker.englishName,
                    secondary: DICTIONARIES.en.languagePicker.englishDesc,
                  },
                  {
                    code: 'hi',
                    scriptBadge: 'हिं',
                    primary: DICTIONARIES.hi.languagePicker.hindiName,
                    secondary: `${DICTIONARIES.hi.languagePicker.hindiDesc} (Hindi)`,
                  },
                ].map((opt) => {
                  const selected = pendingGateLang === opt.code;
                  return (
                    <button
                      key={opt.code}
                      type="button"
                      onClick={() => {
                        setPendingGateLang(opt.code);
                        handleConfirmInitialLanguage(opt.code);
                      }}
                      className={`tactile-btn w-full rounded-2xl p-3.5 text-left flex items-center justify-between gap-3 ${
                        selected
                          ? 'bg-civic-light border-civic-mid text-ink'
                          : 'bg-paper-card hover:bg-paper-warm border-paper-border text-ink hc-card'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          aria-hidden="true"
                          className="w-10 h-10 rounded-full bg-civic text-white font-bold text-sm flex items-center justify-center shrink-0"
                        >
                          {opt.scriptBadge}
                        </span>
                        <div className="min-w-0">
                          <span className="block font-extrabold text-lg text-ink leading-snug">
                            {opt.primary}
                          </span>
                          <span className="block text-sm text-ink-muted hc-muted leading-snug">
                            {opt.secondary}
                          </span>
                        </div>
                      </div>
                      <Icon
                        name={selected ? 'check' : 'next'}
                        className={`w-5 h-5 shrink-0 ${selected ? 'text-civic-mid' : 'text-ink-soft'}`}
                      />
                    </button>
                  );
                })}
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => handleConfirmInitialLanguage(pendingGateLang)}
                  className="tactile-btn rounded-2xl bg-civic hover:bg-civic-dark text-white border-civic-dark px-6 py-3 font-extrabold text-base flex items-center gap-2 hc-primary"
                >
                  <span>{DICTIONARIES[pendingGateLang].common.next}</span>
                  <Icon name="next" className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Urgent Flag Confirmation & Safety Sheet */}
        {urgentModalOpen && (
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="urgent-modal-title"
            className="fixed inset-0 z-50 bg-ink/65 backdrop-blur-sm flex items-center justify-center p-3 overflow-y-auto"
          >
            <div className="calm-card hc-card border-2 border-urgent rounded-3xl max-w-lg w-full p-5 sm:p-6 space-y-4 my-auto">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-2xl bg-urgent text-white flex items-center justify-center shrink-0 animate-pulse">
                  <Icon name="urgent" className="w-6 h-6" />
                </div>
                <div>
                  <h2 id="urgent-modal-title" className="text-xl font-extrabold text-urgent-dark">
                    {dict.common.urgentHelpSentTitle}
                  </h2>
                  {urgentSentFlag ? (
                    <p className="text-sm font-bold text-ink-muted mt-0.5">
                      {dict.common.urgentIdLabel}: {urgentSentFlag.id.slice(-6).toUpperCase()} •{' '}
                      {urgentSentFlag.clockStr}
                    </p>
                  ) : null}
                </div>
              </div>

              <p className="text-base font-medium text-ink bg-urgent-light border border-urgent-border rounded-2xl p-3.5">
                {dict.common.urgentHelpSentBody}
              </p>

              <div className="space-y-2">
                <p className="text-sm font-bold text-ink">{dict.common.urgentWherePrompt}</p>
                <div className="flex flex-wrap gap-2">
                  {QUICK_PLACES_FOR_URGENT.map((pid) => (
                    <button
                      key={pid}
                      type="button"
                      onClick={() => handleUpdateUrgentLocation(pid)}
                      className={`tactile-btn px-3 py-2 rounded-xl border font-bold text-sm flex items-center gap-1.5 ${
                        urgentPlace === pid
                          ? 'bg-urgent text-white border-urgent-dark'
                          : 'bg-paper hover:bg-paper-warm text-ink border-paper-strong'
                      }`}
                    >
                      <Icon name="pin" className="w-4 h-4" />
                      <span>{dict.places[pid]?.name || pid}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                <a
                  href="tel:112"
                  className="tactile-btn rounded-2xl bg-urgent hover:bg-urgent-dark text-white border-urgent-dark px-4 py-3 font-extrabold flex items-center justify-center gap-2 text-base"
                >
                  <Icon name="phone" className="w-5 h-5" />
                  <span>112 / 108</span>
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setUrgentModalOpen(false);
                    navigate('/emergency');
                  }}
                  className="tactile-btn rounded-2xl bg-civic hover:bg-civic-dark text-white border-civic-dark px-4 py-3 font-extrabold flex items-center justify-center gap-2 text-base hc-primary"
                >
                  <Icon name="pin" className="w-5 h-5" />
                  <span>{dict.common.emergency}</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setUrgentModalOpen(false)}
                className="tactile-btn w-full rounded-2xl bg-paper-warm hover:bg-paper-border text-ink border-paper-strong px-4 py-3 font-bold text-base flex items-center justify-center gap-2"
              >
                <Icon name="close" className="w-5 h-5" />
                <span>{dict.common.close}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </UrgentHelpContext.Provider>
  );
}
