import React from 'react';
import { AppShell } from '../components/AppShell.jsx';
import { Icon } from '../components/Icons.jsx';
import { useHospital } from '../context/HospitalContext.jsx';
import { speakText } from '../utils/sound.js';

export function SettingsPage() {
  const { dict, lang, prefs, updatePrefs } = useHospital();
  const s = dict.settings;

  const toggleSetting = (key) => {
    const nextVal = !prefs[key];
    if (key === 'assistedMode' && nextVal) {
      updatePrefs({
        assistedMode: true,
        textSize: prefs.textSize === 'xlarge' ? 'xlarge' : 'large',
        readAloud: true,
        avoidStairs: true,
      });
      return;
    }
    updatePrefs({ [key]: nextVal });
    if (key === 'readAloud' && nextVal) {
      speakText(`${s.readAloudLabel}: ${dict.common.switchOn}`, lang);
    }
  };

  return (
    <AppShell pageReadText={`${s.title}. ${s.subtitle}`} customTitle={dict.common.settings}>
      <div className="max-w-xl mx-auto space-y-4">
        {/* ==================== UNIFIED CLEAN SETTINGS CARD (Matches Screen 11 of Reference Design) ==================== */}
        <section className="calm-card hc-card rounded-3xl divide-y divide-paper-border overflow-hidden">
          {/* Header */}
          <div className="p-5">
            <h1 className="text-2xl font-extrabold text-ink">{s.title}</h1>
            <p className="text-sm sm:text-base text-ink-muted hc-muted mt-0.5">{s.subtitle}</p>
          </div>

          {/* 1. Language Row */}
          <div className="p-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-civic-light text-civic-mid flex items-center justify-center shrink-0">
                <Icon name="globe" className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-extrabold text-ink">{s.langLabel}</h2>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => updatePrefs({ lang: 'en', langChosen: true })}
                aria-pressed={lang === 'en'}
                className={`tactile-btn rounded-2xl px-4 py-3 font-extrabold text-base flex items-center justify-center gap-2 ${
                  lang === 'en'
                    ? 'bg-civic text-white border-civic-dark hc-primary'
                    : 'bg-paper hover:bg-paper-warm text-ink border-paper-border hc-card'
                }`}
              >
                <Icon name={lang === 'en' ? 'check' : 'globe'} className="w-4 h-4" />
                <span>English</span>
              </button>

              <button
                type="button"
                onClick={() => updatePrefs({ lang: 'hi', langChosen: true })}
                aria-pressed={lang === 'hi'}
                className={`tactile-btn rounded-2xl px-4 py-3 font-extrabold text-base flex items-center justify-center gap-2 ${
                  lang === 'hi'
                    ? 'bg-civic text-white border-civic-dark hc-primary'
                    : 'bg-paper hover:bg-paper-warm text-ink border-paper-border hc-card'
                }`}
              >
                <Icon name={lang === 'hi' ? 'check' : 'globe'} className="w-4 h-4" />
                <span>हिंदी</span>
              </button>
            </div>
          </div>

          {/* 2. Text Size Row */}
          <div className="p-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-civic-light text-civic-mid flex items-center justify-center shrink-0">
                <Icon name="textSize" className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-extrabold text-ink">{s.textSizeLabel}</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                { id: 'normal', label: s.sizeNormal },
                { id: 'large', label: s.sizeLarge },
                { id: 'xlarge', label: s.sizeXLarge },
              ].map((opt) => {
                const active = prefs.textSize === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => updatePrefs({ textSize: opt.id })}
                    aria-pressed={active}
                    className={`tactile-btn rounded-2xl px-3.5 py-3 font-extrabold text-sm sm:text-base flex items-center justify-center gap-1.5 ${
                      active
                        ? 'bg-civic text-white border-civic-dark hc-primary'
                        : 'bg-paper hover:bg-paper-warm text-ink border-paper-border hc-card'
                    }`}
                  >
                    <Icon name={active ? 'check' : 'textSize'} className="w-4 h-4" />
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Toggle Switch Rows (High Contrast, Read Aloud, Avoid Stairs, Assisted Mode) */}
          {[
            {
              key: 'highContrast',
              title: s.contrastLabel,
              desc: s.contrastDesc,
              icon: 'contrast',
            },
            {
              key: 'readAloud',
              title: s.readAloudLabel,
              desc: s.readAloudDesc,
              icon: 'speaker',
            },
            {
              key: 'avoidStairs',
              title: s.avoidStairsLabel,
              desc: s.avoidStairsDesc,
              icon: 'stairs',
            },
            {
              key: 'assistedMode',
              title: s.assistedModeLabel,
              desc: s.assistedModeDesc,
              icon: 'wheelchair',
            },
          ].map((row) => {
            const checked = Boolean(prefs[row.key]);
            return (
              <div
                key={row.key}
                className="p-4 sm:p-5 flex items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-civic-light text-civic-mid flex items-center justify-center shrink-0 mt-0.5">
                    <Icon name={row.icon} className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <label
                      htmlFor={`setting-${row.key}`}
                      className="font-extrabold text-base sm:text-lg text-ink block cursor-pointer leading-snug"
                    >
                      {row.title}
                    </label>
                    <p className="text-xs sm:text-sm text-ink-muted hc-muted mt-0.5 leading-snug">
                      {row.desc}
                    </p>
                  </div>
                </div>

                {/* Pill Toggle Switch with Icon + Word (>= 56px tall) */}
                <button
                  id={`setting-${row.key}`}
                  type="button"
                  role="switch"
                  aria-checked={checked}
                  onClick={() => toggleSetting(row.key)}
                  className={`tactile-btn min-w-[92px] px-3.5 py-2.5 rounded-full border font-extrabold text-sm flex items-center justify-center gap-1.5 shrink-0 ${
                    checked
                      ? 'bg-civic-mid text-white border-civic hc-primary'
                      : 'bg-paper-warm text-ink border-paper-strong hc-card'
                  }`}
                >
                  <Icon name={checked ? 'check' : row.icon} className="w-4 h-4" />
                  <span>{checked ? dict.common.switchOn : dict.common.switchOff}</span>
                </button>
              </div>
            );
          })}
        </section>
      </div>
    </AppShell>
  );
}
