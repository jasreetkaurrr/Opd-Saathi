// Pure Web Audio API chimes, vibration, SpeechSynthesis, and Browser Notifications
// Zero external audio files needed — fast on weak connections.

let sharedAudioCtx = null;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  if (
    typeof navigator !== 'undefined' &&
    navigator.userActivation &&
    !navigator.userActivation.hasBeenActive
  ) {
    return null;
  }
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  if (!sharedAudioCtx) {
    sharedAudioCtx = new Ctx();
  }
  if (sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

export function unlockAudio() {
  try {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
  } catch {
    // ignore
  }
}

function playToneSequence(notes) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    for (const { freq, start, duration, type = 'sine', gain = 0.18 } of notes) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now + start);
      g.gain.setValueAtTime(0.001, now + start);
      g.gain.exponentialRampToValueAtTime(gain, now + start + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, now + start + duration);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(now + start);
      osc.stop(now + start + duration + 0.03);
    }
  } catch {
    // ignore audio block
  }
}

export function vibrateDevice(pattern = [250, 120, 250]) {
  try {
    if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
    if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return;
    navigator.vibrate(pattern);
  } catch {
    // ignore
  }
}

// Gentle 3-note chime when 3 people are ahead
export function playTurnCloseAlert() {
  vibrateDevice([300, 120, 300, 120, 400]);
  playToneSequence([
    { freq: 523.25, start: 0, duration: 0.22, type: 'triangle', gain: 0.22 },
    { freq: 659.25, start: 0.2, duration: 0.22, type: 'triangle', gain: 0.22 },
    { freq: 783.99, start: 0.4, duration: 0.38, type: 'triangle', gain: 0.25 },
  ]);
}

// Warm two-tone hospital ding-dong when token is called
export function playTokenCalledChime() {
  vibrateDevice([450, 150, 450, 150, 600]);
  playToneSequence([
    { freq: 659.25, start: 0, duration: 0.35, type: 'sine', gain: 0.28 },
    { freq: 523.25, start: 0.35, duration: 0.55, type: 'sine', gain: 0.28 },
    { freq: 659.25, start: 1.0, duration: 0.35, type: 'sine', gain: 0.28 },
    { freq: 783.99, start: 1.35, duration: 0.6, type: 'sine', gain: 0.3 },
  ]);
}

// High-attention urgent pulse for Staff Dashboard when an unseen urgent flag is raised
export function playUrgentStaffAlarm() {
  playToneSequence([
    { freq: 880, start: 0, duration: 0.18, type: 'sawtooth', gain: 0.14 },
    { freq: 660, start: 0.2, duration: 0.18, type: 'sawtooth', gain: 0.14 },
    { freq: 880, start: 0.42, duration: 0.22, type: 'sawtooth', gain: 0.16 },
  ]);
}

export function stopSpeech() {
  try {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  } catch {
    // ignore
  }
}

export function speakText(text, langCode = 'en', onEnd) {
  if (!text) return;
  try {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      if (onEnd) onEnd();
      return;
    }
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    const targetBcp = langCode === 'hi' ? 'hi-IN' : 'en-IN';
    utter.lang = targetBcp;
    utter.rate = langCode === 'hi' ? 0.92 : 0.94; // Calm, unhurried pace for elderly listeners

    const voices = window.speechSynthesis.getVoices?.() || [];
    const exactVoice =
      voices.find((v) => v.lang?.toLowerCase() === targetBcp.toLowerCase()) ||
      voices.find((v) => v.lang?.toLowerCase().startsWith(langCode === 'hi' ? 'hi' : 'en'));
    if (exactVoice) {
      utter.voice = exactVoice;
    }

    utter.onend = () => {
      if (onEnd) onEnd();
    };
    utter.onerror = () => {
      if (onEnd) onEnd();
    };
    window.speechSynthesis.speak(utter);
  } catch {
    if (onEnd) onEnd();
  }
}

export async function requestNotificationPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  if (window.Notification.permission === 'granted') return 'granted';
  try {
    return await window.Notification.requestPermission();
  } catch {
    return 'denied';
  }
}

export function sendBrowserNotification(title, body, tag = 'opd-saathi') {
  try {
    if (typeof window !== 'undefined' && 'Notification' in window && window.Notification.permission === 'granted') {
      new window.Notification(title, {
        body,
        tag,
      });
    }
  } catch {
    // ignore
  }
}
