import React, { useState } from 'react';
import { AppShell } from '../components/AppShell.jsx';
import { Icon } from '../components/Icons.jsx';
import { QrCodeSvg } from '../components/QrCodeSvg.jsx';
import { DEPARTMENTS } from '../data/departments.js';
import { useHospital } from '../context/HospitalContext.jsx';
import { formatStr } from '../i18n/index.js';

export function StaffCounterPage() {
  const { dict, lang, registerPatient, getPatientDetails } = useHospital();
  const c = dict.counter;
  const s = dict.slip;

  const [firstName, setFirstName] = useState('');
  const [age, setAge] = useState('58');
  const [gender, setGender] = useState('female');
  const [selectedChoice, setSelectedChoice] = useState('cat:med');
  const [issuedToken, setIssuedToken] = useState(null);
  const [recentCounterTokens, setRecentCounterTokens] = useState([]);

  const handleIssueSlip = (e) => {
    e.preventDefault();
    const cleanName = firstName.trim() || c.defaultWalkInName;
    const isAutoMed = selectedChoice === 'cat:med';
    const explicitDepartmentId = isAutoMed ? null : selectedChoice.replace('dept:', '');

    const ticket = registerPatient({
      firstName: cleanName,
      age: Number(age) || 58,
      gender,
      mobile: '',
      categoryId: 'med',
      explicitDepartmentId,
      saveToPhone: false,
    });

    if (ticket) {
      setIssuedToken(ticket.token);
      setRecentCounterTokens((prev) => [ticket.token, ...prev].slice(0, 6));
      setFirstName('');
    }
  };

  const issuedDetails = issuedToken ? getPatientDetails(issuedToken) : null;
  const qrUrl =
    typeof window !== 'undefined' && issuedDetails
      ? `${window.location.origin}/turn/${issuedDetails.patient.token}`
      : `OPD:${issuedToken || ''}`;

  return (
    <AppShell hideFirstVisitModal customTitle={c.title} backTo="/staff">
      <div className="max-w-xl mx-auto space-y-5">
        {!issuedDetails ? (
          /* ==================== REGISTRATION COUNTER FORM CARD (Matches Screen 13 of Reference Design) ==================== */
          <form
            onSubmit={handleIssueSlip}
            className="no-print calm-card hc-card rounded-3xl p-5 sm:p-6 space-y-4"
          >
            <div>
              <h1 className="text-2xl font-extrabold text-ink">{c.title}</h1>
              <p className="text-sm sm:text-base text-ink-muted hc-muted mt-0.5">{c.subtitle}</p>
            </div>

            {/* Patient Name */}
            <div>
              <label htmlFor="counter-name" className="block font-bold text-sm sm:text-base text-ink mb-1">
                {c.firstName}
              </label>
              <input
                id="counter-name"
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder={c.firstNamePlaceholder}
                className="w-full min-h-[56px] px-4 py-2.5 rounded-2xl border border-paper-strong focus:border-civic bg-white text-ink font-bold text-lg"
              />
            </div>

            {/* Age */}
            <div>
              <label htmlFor="counter-age" className="block font-bold text-sm sm:text-base text-ink mb-1">
                {c.age}
              </label>
              <input
                id="counter-age"
                type="number"
                min="0"
                max="120"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full min-h-[56px] px-4 py-2.5 rounded-2xl border border-paper-strong focus:border-civic bg-white text-ink font-bold text-lg"
              />
            </div>

            {/* Gender 3-Pill Selector (Soft Sky-Slate Blue when selected, matching Screen 13) */}
            <div className="space-y-1.5">
              <span className="block font-bold text-sm sm:text-base text-ink">{c.gender}</span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'female', label: dict.register.genderFemale, icon: 'women' },
                  { id: 'male', label: dict.register.genderMale, icon: 'person' },
                  { id: 'other', label: dict.register.genderOther, icon: 'check' },
                ].map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setGender(g.id)}
                    aria-pressed={gender === g.id}
                    className={`tactile-btn rounded-xl px-2.5 py-2.5 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 ${
                      gender === g.id
                        ? 'bg-sky-badge text-white border-sky-ink hc-primary'
                        : 'bg-paper text-ink border-paper-border hc-card'
                    }`}
                  >
                    <Icon name={g.icon} className="w-4 h-4" />
                    <span>{g.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Department Select matching Screen 13 */}
            <div>
              <label htmlFor="counter-dept-select" className="block font-bold text-sm sm:text-base text-ink mb-1">
                {c.selectDept}
              </label>
              <select
                id="counter-dept-select"
                value={selectedChoice}
                onChange={(e) => setSelectedChoice(e.target.value)}
                className="w-full min-h-[56px] px-4 py-2.5 rounded-2xl border border-paper-strong focus:border-civic bg-white text-ink font-bold text-base"
              >
                <option value="cat:med">{c.autoBalanceMed}</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d.id} value={`dept:${d.id}`}>
                    {formatStr(s.roomText, { room: d.roomNumber })}:{' '}
                    {dict.departments[d.id]?.shortName}
                  </option>
                ))}
              </select>
            </div>

            {/* Register & Print Slip CTA */}
            <button
              type="submit"
              className="tactile-btn w-full rounded-2xl bg-civic hover:bg-civic-dark text-white border-civic-dark px-5 py-3.5 font-extrabold text-lg flex items-center justify-center gap-2.5 hc-primary"
            >
              <Icon name="print" className="w-5 h-5" />
              <span>{c.issueAndPrintBtn}</span>
            </button>

            <p className="text-xs sm:text-sm font-medium text-ink-muted hc-muted text-center">
              {c.printsNote}
            </p>
          </form>
        ) : (
          /* Printable Paper OPD Slip View */
          <div className="space-y-4">
            <article className="printable-slip calm-card hc-card rounded-3xl bg-white p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-paper-border pb-3">
                <div>
                  <h2 className="text-lg font-extrabold text-ink">{dict.hospitalName}</h2>
                  <p className="text-xs font-bold text-ink-muted">{s.slipHeader}</p>
                </div>
                <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-lg bg-paper-warm">
                  {issuedDetails.dept.opdHours}
                </span>
              </div>

              <div className="rounded-2xl bg-civic-light border border-civic-border p-4 text-center">
                <p className="text-xs font-extrabold uppercase text-civic">{s.tokenLabel}</p>
                <p className="font-mono text-4xl sm:text-5xl font-black text-ink mt-1">
                  {issuedDetails.patient.token}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-base">
                <div>
                  <span className="block text-xs font-bold text-ink-muted">{s.firstNameLabel}</span>
                  <span className="font-extrabold text-lg text-ink">
                    {issuedDetails.patient.firstName}
                  </span>
                </div>
                <div>
                  <span className="block text-xs font-bold text-ink-muted">{s.departmentLabel}</span>
                  <span className="font-extrabold text-lg text-ink">
                    {dict.departments[issuedDetails.dept.id]?.shortName}
                  </span>
                </div>
                <div>
                  <span className="block text-xs font-bold text-ink-muted">{s.roomFloorLabel}</span>
                  <span className="font-extrabold text-lg text-ink">
                    {formatStr(s.roomText, { room: issuedDetails.dept.roomNumber })} •{' '}
                    {dict.floors[issuedDetails.dept.floor]}
                  </span>
                </div>
                <div>
                  <span className="block text-xs font-bold text-ink-muted">{s.doctorLabel}</span>
                  <span className="font-bold text-base text-ink">
                    {issuedDetails.dept.doctor[lang] || issuedDetails.dept.doctor.en}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-paper-border flex items-center justify-between gap-4">
                <div>
                  <p className="font-extrabold text-base text-civic">
                    {issuedDetails.aheadText} • {issuedDetails.waitText}
                  </p>
                  <p className="text-xs font-medium text-ink-muted mt-0.5">
                    {dict.places[issuedDetails.dept.placeId]?.landmark}
                  </p>
                </div>
                <QrCodeSvg
                  value={qrUrl}
                  size={104}
                  label={formatStr(s.qrAriaLabel, { token: issuedDetails.patient.token })}
                />
              </div>
            </article>

            <div className="no-print grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => window.print()}
                className="tactile-btn rounded-2xl bg-civic hover:bg-civic-dark text-white border-civic-dark px-5 py-3.5 font-extrabold text-base flex items-center justify-center gap-2 hc-primary"
              >
                <Icon name="print" className="w-5 h-5" />
                <span>{c.printNowBtn}</span>
              </button>

              <button
                type="button"
                onClick={() => setIssuedToken(null)}
                className="tactile-btn rounded-2xl bg-paper-card hover:bg-paper-warm text-ink border-paper-strong px-5 py-3.5 font-extrabold text-base flex items-center justify-center gap-2 hc-card"
              >
                <Icon name="person" className="w-5 h-5 text-civic-mid" />
                <span>{c.registerAnotherBtn}</span>
              </button>
            </div>
          </div>
        )}

        {recentCounterTokens.length > 0 && (
          <section className="no-print calm-card hc-card rounded-2xl p-4 space-y-2">
            <h2 className="text-xs font-extrabold uppercase text-ink-muted hc-muted">
              {c.recentCounterSlips}
            </h2>
            <div className="flex flex-wrap gap-2">
              {recentCounterTokens.map((tk) => (
                <button
                  key={tk}
                  type="button"
                  onClick={() => setIssuedToken(tk)}
                  className="tactile-btn px-3.5 py-2 rounded-xl bg-paper hover:bg-civic-light border-paper-border font-mono font-bold text-sm text-ink flex items-center gap-1.5 hc-card"
                >
                  <Icon name="ticket" className="w-4 h-4 text-civic-mid" />
                  <span>{tk}</span>
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}
