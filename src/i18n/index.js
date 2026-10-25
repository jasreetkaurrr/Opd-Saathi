import { en } from './en.js';
import { hi } from './hi.js';

export const DICTIONARIES = { en, hi };

export function formatStr(template, vars = {}) {
  if (!template) return '';
  return String(template).replace(/\{(\w+)\}/g, (_, key) =>
    vars[key] !== undefined && vars[key] !== null ? String(vars[key]) : ''
  );
}

const DEVANAGARI_DIGITS = '०१२३४५६७८९';

const SPOKEN_NUMBER_WORDS = {
  एक: '1',
  दो: '2',
  तीन: '3',
  चार: '4',
  पांच: '5',
  पाँच: '5',
  छह: '6',
  सात: '7',
  आठ: '8',
  नौ: '9',
  दस: '10',
  बीस: '20',
  तीस: '30',
  चालीस: '40',
  पचास: '50',
  साठ: '60',
  बासठ: '62',
  सत्तर: '70',
  अस्सी: '80',
};

/**
 * Convert Devanagari digits (०-९) and common Hindi spoken number words into ASCII digits (0-9).
 */
export function normalizeDigits(str = '') {
  let out = String(str).trim();
  if (SPOKEN_NUMBER_WORDS[out]) {
    return SPOKEN_NUMBER_WORDS[out];
  }
  out = out.replace(/[०-९]/g, (ch) => {
    const idx = DEVANAGARI_DIGITS.indexOf(ch);
    return idx >= 0 ? String(idx) : ch;
  });
  return out;
}
