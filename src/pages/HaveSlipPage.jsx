import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppShell } from '../components/AppShell.jsx';
import { Icon } from '../components/Icons.jsx';
import { GlossaryNote } from '../components/GlossaryNote.jsx';
import { useHospital } from '../context/HospitalContext.jsx';
import { formatStr, normalizeDigits } from '../i18n/index.js';
import { speakText } from '../utils/sound.js';

const PREFIXES = ['MED', 'CHD', 'WOM', 'BON', 'ENT', 'EYE', 'SKN'];

export function HaveSlipPage() {
  const { dict, lang, prefs, hospitalState, activeSavedTokens, getPatientDetails } = useHospital();
  const navigate = useNavigate();
  const h = dict.haveSlip;

  const [activeTab, setActiveTab] = useState('enter'); // 'enter' | 'scan'
  const [tokenInput, setTokenInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [scanning, setScanning] = useState(false);
  const [isListeningMic, setIsListeningMic] = useState(false);
  const [hasBarcodeDetector, setHasBarcodeDetector] = useState(
    () => typeof window !== 'undefined' && typeof window.BarcodeDetector === 'function'
  );

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const scanLoopRef = useRef(null);
  const recognitionRef = useRef(null);

  const SpeechRecognitionImpl =
    typeof window !== 'undefined'
      ? window.SpeechRecognition || window.webkitSpeechRecognition || null
      : null;

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.BarcodeDetector !== 'function') {
      setHasBarcodeDetector(false);
      return;
    }
    if (typeof window.BarcodeDetector.getSupportedFormats === 'function') {
      window.BarcodeDetector.getSupportedFormats()
        .then((formats) => {
          if (Array.isArray(formats) && !formats.includes('qr_code')) {
            setHasBarcodeDetector(false);
          }
        })
        .catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (prefs.readAloud) {
      speakText(`${h.pageTitle}. ${h.subtitle}`, lang);
    }
  }, [prefs.readAloud, lang, h.pageTitle, h.subtitle]);

  const stopCamera = () => {
    if (scanLoopRef.current) {
      window.clearInterval(scanLoopRef.current);
      scanLoopRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setScanning(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
      try {
        recognitionRef.current?.stop();
      } catch {
        // ignore
      }
    };
  }, []);

  const handleVoiceToken = () => {
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
      rec.onstart = () => setIsListeningMic(true);
      rec.onend = () => setIsListeningMic(false);
      rec.onerror = () => setIsListeningMic(false);
      rec.onresult = (event) => {
        const transcript = event.results?.[0]?.[0]?.transcript?.trim() || '';
        if (!transcript) return;
        setErrorMsg('');
        setTokenInput(normalizeDigits(transcript).toUpperCase().replace(/\s+/g, ''));
      };
      rec.start();
    } catch {
      setIsListeningMic(false);
    }
  };

  const startQrScan = async () => {
    if (!hasBarcodeDetector) return;
    setErrorMsg('');
    setActiveTab('scan');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      setScanning(true);

      window.setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      }, 60);

      const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
      scanLoopRef.current = window.setInterval(async () => {
        if (!videoRef.current || videoRef.current.readyState < 2) return;
        try {
          const barcodes = await detector.detect(videoRef.current);
          if (barcodes && barcodes.length > 0) {
            const raw = barcodes[0].rawValue || '';
            const matchUrl = raw.match(/\/turn\/([A-Za-z]{3}-?\d{1,4})/);
            const extracted = matchUrl ? matchUrl[1] : raw.trim();
            const found = getPatientDetails(extracted);
            if (found) {
              stopCamera();
              navigate(`/turn/${found.patient.token}?showWay=1`);
            }
          }
        } catch {
          // ignore frame detection error
        }
      }, 350);
    } catch {
      stopCamera();
      setErrorMsg(h.cameraError);
    }
  };

  const handleOpenToken = (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    const cleanCandidate = normalizeDigits(tokenInput);
    const found = getPatientDetails(cleanCandidate);
    if (!found) {
      setErrorMsg(formatStr(h.invalidToken, { token: tokenInput.trim() || '?' }));
      return;
    }
    navigate(`/turn/${found.patient.token}?showWay=1`);
  };

  const sampleActiveTokens = hospitalState.patients
    .filter((p) => p.status === 'waiting' || p.status === 'serving')
    .slice(0, 5);

  return (
    <AppShell pageReadText={`${h.pageTitle}. ${h.subtitle}`} customTitle={h.pageTitle}>
      <div className="max-w-xl mx-auto space-y-5">
        {/* ==================== MAIN SLIP ENTRY CARD (Matches Screen 9 of Reference Design) ==================== */}
        <section className="calm-card hc-card rounded-3xl p-5 sm:p-6 space-y-5">
          {/* Underline Tabs (Enter token | Scan QR where supported) */}
          {hasBarcodeDetector ? (
            <div className="grid grid-cols-2 border-b border-paper-border">
              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  setActiveTab('enter');
                }}
                className={`tactile-btn border-0 border-b-3 shadow-none rounded-t-xl rounded-b-none px-3 py-2.5 font-extrabold text-base flex items-center justify-center gap-2 ${
                  activeTab === 'enter'
                    ? 'border-b-civic text-civic bg-civic-light/30'
                    : 'border-b-transparent text-ink-muted hc-muted'
                }`}
              >
                <Icon name="ticket" className="w-4 h-4" />
                <span>{h.tabEnter}</span>
              </button>
              <button
                type="button"
                onClick={startQrScan}
                className={`tactile-btn border-0 border-b-3 shadow-none rounded-t-xl rounded-b-none px-3 py-2.5 font-extrabold text-base flex items-center justify-center gap-2 ${
                  activeTab === 'scan'
                    ? 'border-b-civic text-civic bg-civic-light/30'
                    : 'border-b-transparent text-ink-muted hc-muted'
                }`}
              >
                <Icon name="qr" className="w-4 h-4" />
                <span>{h.tabScan}</span>
              </button>
            </div>
          ) : (
            <div>
              <h1 className="text-2xl font-extrabold text-ink">{h.pageTitle}</h1>
              <p className="text-sm sm:text-base text-ink-muted hc-muted mt-1">{h.subtitle}</p>
            </div>
          )}

          {/* Token Entry Form */}
          <form onSubmit={handleOpenToken} className="space-y-4">
            <div>
              <label htmlFor="slip-token-input" className="block font-extrabold text-lg text-ink">
                {h.inputLabel}
              </label>
              <p className="text-xs sm:text-sm text-ink-muted hc-muted mb-2">
                ({h.inputPlaceholder})
              </p>
              <div className="flex items-center gap-2.5">
                <input
                  id="slip-token-input"
                  type="text"
                  value={tokenInput}
                  onChange={(e) => {
                    setErrorMsg('');
                    setTokenInput(normalizeDigits(e.target.value).toUpperCase());
                  }}
                  placeholder={h.inputPlaceholder}
                  className="flex-1 min-w-0 min-h-[58px] px-4 py-3 rounded-2xl border border-paper-strong focus:border-civic font-mono text-2xl font-extrabold uppercase tracking-wider bg-white text-ink"
                />
                {SpeechRecognitionImpl && (
                  <button
                    type="button"
                    onClick={handleVoiceToken}
                    aria-label={dict.register.micSpeak}
                    className={`tactile-btn rounded-full px-3.5 py-2.5 font-bold text-sm flex items-center gap-1.5 shrink-0 ${
                      isListeningMic
                        ? 'bg-ochre text-white border-ochre animate-pulse'
                        : 'bg-civic-light text-civic border-civic-border hc-card'
                    }`}
                  >
                    <Icon name="mic" className="w-5 h-5" />
                    <span className="sr-only sm:not-sr-only">{dict.register.micSpeak}</span>
                  </button>
                )}
              </div>
            </div>

            {/* 1-Tap Department Letter Pills */}
            <div className="space-y-1.5">
              <p className="text-xs sm:text-sm font-bold text-ink-muted hc-muted">
                {h.prefixHelper}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {PREFIXES.map((px) => (
                  <button
                    key={px}
                    type="button"
                    onClick={() => {
                      setErrorMsg('');
                      const digits = normalizeDigits(tokenInput).replace(/[^0-9]/g, '');
                      setTokenInput(`${px}-${digits}`);
                    }}
                    className="tactile-btn px-3 py-2 rounded-xl bg-paper hover:bg-civic-light border-paper-border font-mono font-extrabold text-sm text-ink flex items-center gap-1 hc-card"
                  >
                    <Icon name="ticket" className="w-3.5 h-3.5 text-civic-mid" />
                    <span>{px}-</span>
                  </button>
                ))}
              </div>
            </div>

            {errorMsg && (
              <div
                role="alert"
                className="rounded-2xl border border-urgent bg-urgent-light p-3.5 font-bold text-urgent-dark flex items-center gap-2 text-sm sm:text-base"
              >
                <Icon name="urgent" className="w-5 h-5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              className="tactile-btn w-full rounded-2xl bg-civic hover:bg-civic-dark text-white border-civic-dark px-5 py-3.5 font-extrabold text-lg flex items-center justify-center gap-2.5 hc-primary"
            >
              <span>{h.openBtn}</span>
              <Icon name="next" className="w-5 h-5" />
            </button>
          </form>

          {/* Soft-Tinted Scan QR Code Card — shown ONLY where BarcodeDetector exists */}
          {hasBarcodeDetector && (
            <div className="pt-1">
              {!scanning ? (
                <button
                  type="button"
                  onClick={startQrScan}
                  className="tactile-btn w-full rounded-2xl bg-paper-warm/85 hover:bg-civic-light/60 text-ink border-paper-border p-4 flex flex-col items-center justify-center gap-1 text-center hc-card"
                >
                  <span className="flex items-center gap-2 font-extrabold text-base text-civic">
                    <Icon name="camera" className="w-5 h-5" />
                    <span>{h.scanQrBtn}</span>
                  </span>
                  <span className="text-xs sm:text-sm text-ink-muted hc-muted">
                    {h.scanAvailableSub}
                  </span>
                </button>
              ) : (
                <div className="rounded-2xl border-2 border-civic bg-ink p-3 space-y-3 text-white">
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    className="w-full rounded-xl max-h-64 object-cover bg-black"
                  />
                  <p className="text-sm font-bold text-center">{h.scanningHint}</p>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="tactile-btn w-full rounded-xl bg-urgent text-white border-urgent-dark py-3 font-extrabold flex items-center justify-center gap-2"
                  >
                    <Icon name="close" className="w-5 h-5" />
                    <span>{h.stopScanBtn}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Calm Footer Note */}
          <p className="pt-1 flex items-center gap-2 text-xs sm:text-sm font-medium text-ink-muted hc-muted">
            <Icon name="slip" className="w-4 h-4 text-civic-mid" />
            <span>{h.footerNote}</span>
          </p>
        </section>

        {/* Saved Slips on This Phone */}
        {activeSavedTokens.length > 0 && (
          <section className="calm-card hc-card rounded-3xl p-4 sm:p-5 space-y-3">
            <h2 className="text-base font-extrabold text-ink">{h.savedOnPhone}</h2>
            <div className="grid grid-cols-1 gap-2">
              {activeSavedTokens.map((tk) => {
                const det = getPatientDetails(tk);
                if (!det) return null;
                return (
                  <Link
                    key={tk}
                    to={`/turn/${tk}?showWay=1`}
                    className="tactile-btn rounded-2xl bg-civic-light/45 hover:bg-civic-light border-civic-border p-3.5 flex items-center justify-between gap-3 hc-card"
                  >
                    <div className="min-w-0">
                      <span className="font-mono text-lg font-black text-ink">{tk}</span>
                      <span className="ml-2 text-sm font-bold text-ink-muted hc-muted">
                        • {det.patient.firstName} ({dict.departments[det.dept.id]?.shortName})
                      </span>
                    </div>
                    <Icon name="next" className="w-5 h-5 text-civic shrink-0" />
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Active Sample Tokens for Quick Demo Testing */}
        <section className="calm-card hc-card rounded-3xl p-4 sm:p-5 space-y-2.5">
          <h2 className="text-sm font-extrabold text-ink-muted hc-muted">{h.trySampleTokens}</h2>
          <div className="flex flex-wrap gap-2">
            {sampleActiveTokens.map((p) => (
              <Link
                key={p.token}
                to={`/turn/${p.token}?showWay=1`}
                className="tactile-btn px-3 py-2 rounded-xl bg-paper hover:bg-civic-light border-paper-border font-mono font-bold text-sm text-ink flex items-center gap-1.5 hc-card"
              >
                <Icon name="ticket" className="w-4 h-4 text-civic-mid" />
                <span>{p.token}</span>
                <span className="font-sans text-xs text-ink-muted hc-muted">({p.firstName})</span>
              </Link>
            ))}
          </div>
        </section>

        <GlossaryNote term="token" />
      </div>
    </AppShell>
  );
}
