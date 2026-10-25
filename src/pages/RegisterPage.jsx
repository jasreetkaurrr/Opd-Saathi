import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AppShell } from '../components/AppShell.jsx';
import { Icon } from '../components/Icons.jsx';
import { GlossaryNote } from '../components/GlossaryNote.jsx';
import { useHospital } from '../context/HospitalContext.jsx';
import { PATIENT_CATEGORIES } from '../data/departments.js';
import { PERSONA_KAMLA } from '../data/patients.js';
import { formatStr, normalizeDigits } from '../i18n/index.js';
import { speakText } from '../utils/sound.js';

const DRAFT_KEY = 'opd_saathi_register_draft_v1';

function loadDraft(isKamlaPreset, lang) {
  if (isKamlaPreset) {
    return {
      step: 0,
      firstName: lang === 'hi' ? PERSONA_KAMLA.firstNameHi : PERSONA_KAMLA.firstName,
      age: String(PERSONA_KAMLA.age),
      gender: PERSONA_KAMLA.gender,
      mobile: PERSONA_KAMLA.mobile,
      categoryId: PERSONA_KAMLA.categoryId,
    };
  }
  try {
    const raw = window.sessionStorage.getItem(DRAFT_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // ignore
  }
  return {
    step: 0, // 0 = Safety Check Gate, 1..5 = 5 steps
    firstName: '',
    age: '',
    gender: '',
    mobile: '',
    categoryId: 'med',
  };
}

export function RegisterPage() {
  const { dict, lang, prefs, updatePrefs, registerPatient } = useHospital();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isKamlaPreset = searchParams.get('persona') === 'kamla';

  const [form, setForm] = useState(() => loadDraft(isKamlaPreset, lang));
  const [errorMsg, setErrorMsg] = useState('');
  const [isListeningMic, setIsListeningMic] = useState(false);
  const recognitionRef = useRef(null);

  const SpeechRecognitionImpl =
    typeof window !== 'undefined'
      ? window.SpeechRecognition || window.webkitSpeechRecognition || null
      : null;

  useEffect(() => {
    try {
      window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify(form));
    } catch {
      // ignore
    }
  }, [form]);

  const r = dict.register;
  const s1Title = prefs.assistedMode ? r.step1TitleAssisted : r.step1Title;
  const s2Title = prefs.assistedMode ? r.step2TitleAssisted : r.step2Title;
  const s3Title = prefs.assistedMode ? r.step3TitleAssisted : r.step3Title;
  const s4Title = prefs.assistedMode ? r.step4TitleAssisted : r.step4Title;
  const s5Title = prefs.assistedMode ? r.step5TitleAssisted : r.step5Title;

  const currentStepReadText = (() => {
    if (form.step === 0) {
      return `${r.safetyTitle}. ${r.safetyBanner}. ${r.dangerSigns.join('. ')}.`;
    }
    if (form.step === 1) return `${formatStr(r.stepProgress, { step: 1 })}. ${s1Title}. ${r.step1Helper}`;
    if (form.step === 2) return `${formatStr(r.stepProgress, { step: 2 })}. ${s2Title}. ${r.step2Helper}`;
    if (form.step === 3) return `${formatStr(r.stepProgress, { step: 3 })}. ${s3Title}.`;
    if (form.step === 4) return `${formatStr(r.stepProgress, { step: 4 })}. ${s4Title}. ${r.step4Helper}`;
    return `${formatStr(r.stepProgress, { step: 5 })}. ${s5Title}. ${r.step5Helper}`;
  })();

  useEffect(() => {
    if (prefs.readAloud || prefs.assistedMode) {
      speakText(currentStepReadText, lang);
    }
  }, [form.step, prefs.readAloud, prefs.assistedMode, lang, currentStepReadText]);

  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.stop();
      } catch {
        // ignore
      }
    };
  }, []);

  const handleToggleAssistedMode = () => {
    const nextVal = !prefs.assistedMode;
    if (nextVal) {
      updatePrefs({
        assistedMode: true,
        textSize: prefs.textSize === 'xlarge' ? 'xlarge' : 'large',
        readAloud: true,
        avoidStairs: true,
      });
    } else {
      updatePrefs({ assistedMode: false });
    }
  };

  const startVoiceInput = (field) => {
    if (!SpeechRecognitionImpl) return;
    if (isListeningMic) {
      try {
        recognitionRef.current?.stop();
      } catch {
        // ignore
      }
      setIsListeningMic(false);
      return;
    }

    try {
      const rec = new SpeechRecognitionImpl();
      recognitionRef.current = rec;
      rec.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
      rec.interimResults = false;
      rec.maxAlternatives = 1;

      rec.onstart = () => setIsListeningMic(true);
      rec.onend = () => setIsListeningMic(false);
      rec.onerror = () => setIsListeningMic(false);
      rec.onresult = (event) => {
        const transcript = event.results?.[0]?.[0]?.transcript?.trim() || '';
        if (!transcript) return;
        setErrorMsg('');
        if (field === 'firstName') {
          const firstWord = transcript.split(/\s+/)[0];
          setForm((prev) => ({ ...prev, firstName: firstWord }));
        } else if (field === 'age') {
          const normalized = normalizeDigits(transcript);
          const digits = normalized.replace(/[^\d]/g, '');
          if (digits) setForm((prev) => ({ ...prev, age: digits.slice(0, 3) }));
        } else if (field === 'mobile') {
          const normalized = normalizeDigits(transcript);
          const digits = normalized.replace(/[^\d]/g, '');
          if (digits) setForm((prev) => ({ ...prev, mobile: digits.slice(0, 10) }));
        }
      };

      rec.start();
    } catch {
      setIsListeningMic(false);
    }
  };

  const goStep = (nextStep) => {
    setErrorMsg('');
    setForm((prev) => ({ ...prev, step: nextStep }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStepNext = (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    if (form.step === 1) {
      if (!form.firstName.trim()) {
        setErrorMsg(dict.register.validationName);
        return;
      }
      goStep(2);
    } else if (form.step === 2) {
      const n = Number(form.age);
      if (form.age === '' || Number.isNaN(n) || n < 0 || n > 120) {
        setErrorMsg(dict.register.validationAge);
        return;
      }
      goStep(3);
    } else if (form.step === 3) {
      if (!form.gender) {
        setErrorMsg(dict.register.validationGender);
        return;
      }
      goStep(4);
    } else if (form.step === 4) {
      goStep(5);
    }
  };

  const handleCompleteRegistration = (chosenCategoryId) => {
    const finalCat = chosenCategoryId || form.categoryId || 'med';
    const created = registerPatient({
      firstName: form.firstName,
      age: Number(form.age) || 60,
      gender: form.gender || 'female',
      mobile: form.mobile,
      categoryId: finalCat,
      saveToPhone: true,
    });
    try {
      window.sessionStorage.removeItem(DRAFT_KEY);
    } catch {
      // ignore
    }
    if (created) {
      navigate(`/slip/${created.token}`);
    }
  };

  const fillKamlaSample = () => {
    setErrorMsg('');
    setForm((prev) => ({
      ...prev,
      firstName: lang === 'hi' ? PERSONA_KAMLA.firstNameHi : PERSONA_KAMLA.firstName,
      age: String(PERSONA_KAMLA.age),
      gender: PERSONA_KAMLA.gender,
      mobile: PERSONA_KAMLA.mobile,
      categoryId: 'med',
    }));
  };

  // Reusable "Someone is helping me" soft sage toggle box matching Screen 3 of Reference Design
  const AssistedModeCard = (
    <div className="hc-card rounded-2xl border border-civic-border bg-civic-light/55 p-3.5 space-y-2.5">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <label
            htmlFor="assisted-mode-toggle"
            className="font-extrabold text-ink text-base block cursor-pointer leading-snug"
          >
            {r.assistedLabel}
          </label>
          <p className="text-xs sm:text-sm text-ink-muted hc-muted mt-0.5 leading-snug">
            {r.assistedHint}
          </p>
        </div>
        <button
          id="assisted-mode-toggle"
          type="button"
          role="switch"
          aria-checked={prefs.assistedMode}
          onClick={handleToggleAssistedMode}
          className={`tactile-btn min-w-[88px] px-3 py-2 rounded-full border font-extrabold text-sm flex items-center justify-center gap-1.5 shrink-0 ${
            prefs.assistedMode
              ? 'bg-civic-mid text-white border-civic hc-primary'
              : 'bg-paper-card text-ink border-paper-strong'
          }`}
        >
          <Icon name={prefs.assistedMode ? 'check' : 'person'} className="w-4 h-4" />
          <span>{prefs.assistedMode ? dict.common.switchOn : dict.common.switchOff}</span>
        </button>
      </div>
      {prefs.assistedMode && (
        <p className="rounded-xl bg-paper-card border border-civic-border px-3 py-2 text-xs sm:text-sm font-bold text-civic hc-card">
          {r.assistedActiveBanner}
        </p>
      )}
    </div>
  );

  // Reusable Centered Halo Microphone Button matching Screen 3 of Reference Design
  const renderCenterMic = (field) => {
    if (!SpeechRecognitionImpl) {
      return (
        <p className="text-sm text-ink-muted hc-muted bg-paper-warm rounded-xl px-3.5 py-2.5 border border-paper-border text-center">
          {r.micUnsupported}
        </p>
      );
    }
    return (
      <div className="py-2 flex flex-col items-center justify-center">
        <button
          type="button"
          onClick={() => startVoiceInput(field)}
          className="group tactile-btn border-0 shadow-none bg-transparent flex flex-col items-center gap-3 px-4 py-2 rounded-3xl"
        >
          <span
            className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center ring-[10px] transition-transform group-hover:scale-105 ${
              isListeningMic
                ? 'bg-ochre text-white ring-ochre-light animate-pulse'
                : 'bg-civic text-white ring-civic-tile'
            }`}
          >
            <Icon name="mic" className="w-9 h-9 sm:w-10 sm:h-10" />
          </span>
          <span className="font-bold text-base text-ink-muted hc-muted">
            {isListeningMic ? r.micListening : r.micSpeak}
          </span>
        </button>
      </div>
    );
  };

  return (
    <AppShell pageReadText={currentStepReadText}>
      <div className="max-w-xl mx-auto space-y-5">
        {/* ==================== STEP 0: FIRST REGISTRATION SCREEN SAFETY GATE ==================== */}
        {form.step === 0 && (
          <section className="calm-card hc-card rounded-3xl overflow-hidden">
            {/* Rounded Crimson Emergency Top Header matching Reference Emergency Card */}
            <div className="bg-urgent px-5 py-4 flex items-center gap-3 text-white">
              <div className="w-10 h-10 rounded-full bg-white text-urgent flex items-center justify-center shrink-0">
                <Icon name="urgent" className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-extrabold leading-tight">
                  {r.safetyTitle}
                </h1>
              </div>
            </div>

            <div className="p-5 sm:p-6 space-y-4">
              <p className="text-base sm:text-lg font-extrabold text-urgent-dark leading-snug">
                {r.safetyBanner}
              </p>

              {/* All 8 Required Emergency Signs */}
              <ul className="space-y-2 pl-1" aria-label={r.safetyTitle}>
                {r.dangerSigns.map((sign, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2.5 text-base font-semibold text-ink leading-snug"
                  >
                    <span
                      aria-hidden="true"
                      className="w-2 h-2 rounded-full bg-urgent mt-2.5 shrink-0"
                    />
                    <span>{sign}</span>
                  </li>
                ))}
              </ul>

              <div className="space-y-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => goStep(1)}
                  className="tactile-btn w-full rounded-2xl bg-civic hover:bg-civic-dark text-white border-civic-dark px-5 py-3.5 font-extrabold text-lg flex items-center justify-center gap-2.5 hc-primary"
                >
                  <span>{r.safetyNoneContinue}</span>
                  <Icon name="next" className="w-5 h-5" />
                </button>

                <Link
                  to="/emergency"
                  className="tactile-btn w-full rounded-2xl bg-coral-light hover:bg-coral-tile text-coral-ink border-coral-badge/50 px-5 py-3 font-extrabold text-base flex items-center justify-center gap-2 text-center hc-card"
                >
                  <Icon name="emergency" className="w-5 h-5 text-urgent" />
                  <span>{r.safetyGoEmergency}</span>
                </Link>
              </div>

              {AssistedModeCard}

              <p className="text-xs sm:text-sm font-medium text-ink-muted hc-muted text-center">
                {r.safetyDisclaimer}
              </p>
            </div>
          </section>
        )}

        {/* ==================== STEPS 1 TO 5: ONE QUESTION PER SCREEN ==================== */}
        {form.step >= 1 && (
          <section className="calm-card hc-card rounded-3xl p-5 sm:p-6 space-y-5">
            {/* 5-Segment Pill Progress Bar ("Step X of 5") matching Screen 3 & 4 of Mockup */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div
                  role="progressbar"
                  aria-valuemin={1}
                  aria-valuemax={5}
                  aria-valuenow={form.step}
                  aria-label={formatStr(r.stepProgress, { step: form.step })}
                  className="flex-1 grid grid-cols-5 gap-1.5"
                >
                  {[1, 2, 3, 4, 5].map((seg) => (
                    <span
                      key={seg}
                      className={`h-2 rounded-full transition-colors duration-300 ${
                        seg <= form.step ? 'bg-civic-mid' : 'bg-paper-strong/45'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs sm:text-sm font-bold text-ink-muted hc-muted shrink-0">
                  {formatStr(r.stepProgress, { step: form.step })}
                </span>
              </div>
            </div>

            {errorMsg && (
              <div
                role="alert"
                className="rounded-2xl border border-urgent bg-urgent-light px-4 py-3 font-bold text-urgent-dark flex items-center gap-2 text-base"
              >
                <Icon name="urgent" className="w-5 h-5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* ---------- STEP 1: FIRST NAME ---------- */}
            {form.step === 1 && (
              <form onSubmit={handleStepNext} className="space-y-4">
                <div>
                  <label htmlFor="patient-first-name" className="block text-2xl font-extrabold text-ink">
                    {s1Title}
                  </label>
                  <p className="text-sm sm:text-base text-ink-muted hc-muted mt-1">{r.step1Helper}</p>
                </div>

                <input
                  id="patient-first-name"
                  type="text"
                  autoComplete="given-name"
                  value={form.firstName}
                  onChange={(e) => setForm((prev) => ({ ...prev, firstName: e.target.value }))}
                  placeholder={r.step1Placeholder}
                  className="w-full min-h-[58px] px-4 py-3 rounded-2xl border border-paper-strong focus:border-civic text-xl font-bold bg-white text-ink shadow-inner"
                />

                {renderCenterMic('firstName')}

                {AssistedModeCard}

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={fillKamlaSample}
                    className="tactile-btn px-3.5 py-2 rounded-xl bg-paper-warm hover:bg-civic-light text-ink border-paper-border font-bold text-xs sm:text-sm flex items-center gap-1.5 hc-card"
                  >
                    <Icon name="person" className="w-4 h-4 text-civic-mid" />
                    <span>{r.tryKamla}</span>
                  </button>
                  <span className="text-xs font-medium text-ink-muted hc-muted">
                    {r.noIdNeeded}
                  </span>
                </div>

                {/* Back + Deep-Forest Next Row matching Screen 3 */}
                <div className="grid grid-cols-3 gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => goStep(0)}
                    className="tactile-btn col-span-1 rounded-2xl bg-paper-card hover:bg-paper-warm text-ink border-paper-strong px-3 py-3 font-bold text-base flex items-center justify-center gap-1.5 hc-card"
                  >
                    <Icon name="back" className="w-4 h-4" />
                    <span>{dict.common.back}</span>
                  </button>
                  <button
                    type="submit"
                    className="tactile-btn col-span-2 rounded-2xl bg-civic hover:bg-civic-dark text-white border-civic-dark px-5 py-3 font-extrabold text-lg flex items-center justify-center gap-2 hc-primary"
                  >
                    <span>{dict.common.next}</span>
                    <Icon name="next" className="w-5 h-5" />
                  </button>
                </div>
              </form>
            )}

            {/* ---------- STEP 2: AGE ---------- */}
            {form.step === 2 && (
              <form onSubmit={handleStepNext} className="space-y-4">
                <div>
                  <label htmlFor="patient-age" className="block text-2xl font-extrabold text-ink">
                    {s2Title}
                  </label>
                  <p className="text-sm sm:text-base text-ink-muted hc-muted mt-1">{r.step2Helper}</p>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    aria-label={dict.a11y.decreaseAge}
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        age: String(Math.max(1, (Number(prev.age) || 60) - 1)),
                      }))
                    }
                    className="tactile-btn px-3.5 rounded-2xl bg-paper-warm border-paper-strong text-lg font-extrabold text-ink flex items-center justify-center gap-1 hc-card"
                  >
                    <Icon name="back" className="w-4 h-4" />
                    <span>−1</span>
                  </button>
                  <input
                    id="patient-age"
                    type="text"
                    inputMode="numeric"
                    value={form.age}
                    onChange={(e) => {
                      const clean = normalizeDigits(e.target.value).replace(/[^\d]/g, '').slice(0, 3);
                      setForm((prev) => ({ ...prev, age: clean }));
                    }}
                    placeholder={r.step2Placeholder}
                    className="flex-1 min-w-0 min-h-[58px] px-3 py-3 rounded-2xl border border-paper-strong focus:border-civic text-2xl font-extrabold text-center bg-white text-ink"
                  />
                  <button
                    type="button"
                    aria-label={dict.a11y.increaseAge}
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        age: String(Math.min(120, (Number(prev.age) || 60) + 1)),
                      }))
                    }
                    className="tactile-btn px-3.5 rounded-2xl bg-paper-warm border-paper-strong text-lg font-extrabold text-ink flex items-center justify-center gap-1 hc-card"
                  >
                    <span>+1</span>
                    <Icon name="next" className="w-4 h-4" />
                  </button>
                </div>

                {renderCenterMic('age')}

                {AssistedModeCard}

                <div className="grid grid-cols-3 gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => goStep(1)}
                    className="tactile-btn col-span-1 rounded-2xl bg-paper-card hover:bg-paper-warm text-ink border-paper-strong px-3 py-3 font-bold text-base flex items-center justify-center gap-1.5 hc-card"
                  >
                    <Icon name="back" className="w-4 h-4" />
                    <span>{dict.common.back}</span>
                  </button>
                  <button
                    type="submit"
                    className="tactile-btn col-span-2 rounded-2xl bg-civic hover:bg-civic-dark text-white border-civic-dark px-5 py-3 font-extrabold text-lg flex items-center justify-center gap-2 hc-primary"
                  >
                    <span>{dict.common.next}</span>
                    <Icon name="next" className="w-5 h-5" />
                  </button>
                </div>
              </form>
            )}

            {/* ---------- STEP 3: GENDER ---------- */}
            {form.step === 3 && (
              <div className="space-y-4">
                <div>
                  <h1 className="text-2xl font-extrabold text-ink">{s3Title}</h1>
                  <p className="text-sm sm:text-base text-ink-muted hc-muted mt-1">{r.step3Helper}</p>
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  {[
                    { id: 'female', label: r.genderFemale, icon: 'women' },
                    { id: 'male', label: r.genderMale, icon: 'person' },
                    { id: 'other', label: r.genderOther, icon: 'check' },
                  ].map((opt) => {
                    const selected = form.gender === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setForm((prev) => ({ ...prev, gender: opt.id }));
                          setErrorMsg('');
                          goStep(4);
                        }}
                        aria-pressed={selected}
                        className={`tactile-btn w-full rounded-2xl p-4 text-left flex items-center justify-between gap-3 ${
                          selected
                            ? 'bg-civic-light border-civic-mid text-ink hc-primary'
                            : 'bg-white hover:bg-paper-warm text-ink border-paper-border hc-card'
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          <div
                            className={`w-11 h-11 rounded-full flex items-center justify-center ${
                              selected ? 'bg-civic text-white' : 'bg-civic-light text-civic-mid'
                            }`}
                          >
                            <Icon name={opt.icon} className="w-6 h-6" />
                          </div>
                          <span className="text-lg sm:text-xl font-extrabold">{opt.label}</span>
                        </div>
                        <Icon name="next" className="w-5 h-5 text-civic" />
                      </button>
                    );
                  })}
                </div>

                {AssistedModeCard}

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => goStep(2)}
                    className="tactile-btn rounded-2xl bg-paper-card hover:bg-paper-warm text-ink border-paper-strong px-4 py-2.5 font-bold text-base flex items-center gap-1.5 hc-card"
                  >
                    <Icon name="back" className="w-4 h-4" />
                    <span>{dict.common.back}</span>
                  </button>
                </div>
              </div>
            )}

            {/* ---------- STEP 4: MOBILE NUMBER (OPTIONAL) ---------- */}
            {form.step === 4 && (
              <form onSubmit={handleStepNext} className="space-y-4">
                <div>
                  <label htmlFor="patient-mobile" className="block text-2xl font-extrabold text-ink">
                    {s4Title}
                  </label>
                  <p className="text-sm sm:text-base text-ink-muted hc-muted mt-1">{r.step4Helper}</p>
                </div>

                <input
                  id="patient-mobile"
                  type="tel"
                  inputMode="tel"
                  value={form.mobile}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      mobile: normalizeDigits(e.target.value)
                        .replace(/[^\d+\s-]/g, '')
                        .slice(0, 14),
                    }))
                  }
                  placeholder={r.step4Placeholder}
                  className="w-full min-h-[58px] px-4 py-3 rounded-2xl border border-paper-strong focus:border-civic text-xl font-mono font-bold bg-white text-ink"
                />

                {renderCenterMic('mobile')}

                <button
                  type="button"
                  onClick={() => {
                    setForm((prev) => ({ ...prev, mobile: '' }));
                    goStep(5);
                  }}
                  className="tactile-btn w-full rounded-2xl bg-paper-warm hover:bg-civic-light text-ink border-paper-border px-4 py-3 font-bold text-sm sm:text-base flex items-center justify-center gap-2 hc-card"
                >
                  <Icon name="next" className="w-4 h-4 text-civic" />
                  <span>{r.skipMobile}</span>
                </button>

                <div className="grid grid-cols-3 gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => goStep(3)}
                    className="tactile-btn col-span-1 rounded-2xl bg-paper-card hover:bg-paper-warm text-ink border-paper-strong px-3 py-3 font-bold text-base flex items-center justify-center gap-1.5 hc-card"
                  >
                    <Icon name="back" className="w-4 h-4" />
                    <span>{dict.common.back}</span>
                  </button>
                  <button
                    type="submit"
                    className="tactile-btn col-span-2 rounded-2xl bg-civic hover:bg-civic-dark text-white border-civic-dark px-5 py-3 font-extrabold text-lg flex items-center justify-center gap-2 hc-primary"
                  >
                    <span>{dict.common.next}</span>
                    <Icon name="next" className="w-5 h-5" />
                  </button>
                </div>
              </form>
            )}

            {/* ---------- STEP 5: WHICH DOCTOR DO YOU NEED? (2-COLUMN CARDS MATCHING SCREEN 4) ---------- */}
            {form.step === 5 && (
              <div className="space-y-4">
                <div>
                  <h1 className="text-2xl font-extrabold text-ink">{s5Title}</h1>
                  <p className="text-sm sm:text-base text-ink-muted hc-muted mt-1">{r.step5Helper}</p>
                </div>

                {/* 2-Column Symptom Picture Cards Grid */}
                <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                  {PATIENT_CATEGORIES.map((cat) => {
                    const catTxt = dict.categories[cat.id];
                    const selected = form.categoryId === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleCompleteRegistration(cat.id)}
                        className={`tactile-btn rounded-2xl p-3 sm:p-4 text-left flex flex-col justify-between gap-2 min-w-0 ${
                          selected
                            ? 'bg-civic-light border-civic-mid text-ink'
                            : 'bg-white hover:bg-civic-light/50 text-ink border-paper-border hc-card'
                        }`}
                      >
                        <div className="flex items-start gap-2.5 min-w-0">
                          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-civic text-white flex items-center justify-center shrink-0">
                            <Icon name={cat.icon} className="w-5 h-5" />
                          </div>
                          <span className="font-extrabold text-sm sm:text-base text-ink leading-snug min-w-0">
                            {catTxt.name}
                          </span>
                        </div>
                        <span className="block text-xs sm:text-sm text-ink-muted hc-muted leading-snug">
                          {catTxt.symptoms}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* "Not sure? Ask at the help desk ->" Card matching bottom of Screen 4 */}
                <Link
                  to="/find?from=entrance&to=help_desk"
                  className="tactile-btn w-full rounded-2xl bg-paper-warm hover:bg-civic-light text-ink border-paper-border p-3.5 text-left flex items-center justify-between gap-3 hc-card"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-civic-light text-civic flex items-center justify-center shrink-0">
                      <Icon name="help" className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <span className="block text-sm sm:text-base font-extrabold text-ink leading-snug">
                        {r.notSureCard}
                      </span>
                      <span className="block text-xs text-ink-muted hc-muted mt-0.5 leading-snug">
                        {r.notSureSub}
                      </span>
                    </div>
                  </div>
                  <Icon name="next" className="w-5 h-5 text-civic shrink-0" />
                </Link>

                <div className="pt-1 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => goStep(4)}
                    className="tactile-btn rounded-2xl bg-paper-card hover:bg-paper-warm text-ink border-paper-strong px-4 py-2.5 font-bold text-base flex items-center gap-1.5 hc-card"
                  >
                    <Icon name="back" className="w-4 h-4" />
                    <span>{dict.common.back}</span>
                  </button>
                </div>

                <GlossaryNote term="opd" />
              </div>
            )}
          </section>
        )}
      </div>
    </AppShell>
  );
}
