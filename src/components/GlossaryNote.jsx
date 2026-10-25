import React from 'react';
import { Icon } from './Icons.jsx';
import { speakText } from '../utils/sound.js';
import { useHospital } from '../context/HospitalContext.jsx';

export function GlossaryNote({ term = 'opd' }) {
  const { dict, lang } = useHospital();

  const map = {
    opd: {
      title: dict.glossary.opdTitle,
      body: dict.glossary.opdExplain,
    },
    token: {
      title: dict.glossary.tokenTitle,
      body: dict.glossary.tokenExplain,
    },
    casualty: {
      title: dict.glossary.casualtyTitle,
      body: dict.glossary.casualtyExplain,
    },
  };

  const item = map[term] || map.opd;

  return (
    <aside
      aria-label={item.title}
      className="hc-card rounded-2xl border border-civic-border bg-civic-light/65 px-4 py-3 flex items-center justify-between gap-3"
    >
      <div className="min-w-0">
        <p className="font-extrabold text-civic text-base leading-snug">{item.title}</p>
        <p className="text-ink-muted hc-muted text-sm sm:text-base leading-snug mt-0.5">{item.body}</p>
      </div>
      <button
        type="button"
        onClick={() => speakText(`${item.title}. ${item.body}`, lang)}
        aria-label={`${dict.common.listen}: ${item.title}`}
        className="tactile-btn shrink-0 px-3.5 py-2 rounded-xl bg-paper-card border-paper-strong text-civic font-bold flex items-center gap-1.5 text-sm hc-card"
      >
        <Icon name="speaker" className="w-4 h-4" />
        <span>{dict.common.listen}</span>
      </button>
    </aside>
  );
}
