import React from 'react';
import { useAuth } from '../context/AuthContext.js';
import { Scale, ShieldCheck, AlertTriangle, Eye, Clock, CheckCircle, FileCheck, ShieldAlert } from 'lucide-react';

export const RulesPolicyPage: React.FC = () => {
  const { language } = useAuth();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="border-b border-slate-800 pb-6 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 text-xs font-semibold uppercase mb-4">
          <Scale className="w-3.5 h-3.5" />
          <span>Official Competitive Codex</span>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-white">
          Terms of Service & Fair-Play Policy
        </h1>
        <p className="text-xs text-slate-400 mt-2 max-w-xl mx-auto">
          Codified guidelines governing human reaction integrity, telemetry collection, AI classification boundaries, terms of service, and appeals across all NEXORA ARENA tournaments.
        </p>
      </div>

      {/* Rules Sections */}
      <div className="space-y-8 text-xs sm:text-sm text-slate-300 leading-relaxed">
        {/* Section 1 */}
        <section className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 font-display text-base font-bold text-white">
            <span className="w-6 h-6 rounded-md bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs">
              1
            </span>
            <span>Permitted & Prohibited Actions</span>
          </div>
          <p>
            Competitors must rely exclusively on human vision, unassisted reflexes, and genuine manual inputs (mouse clicks or physical touchscreen taps).
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-400 text-xs">
            <li><strong className="text-rose-400">Prohibited:</strong> Automation bots, hardware macros, auto-clickers, memory injectors, altered browser runtimes, headless browser drivers, or automated screen-reading tools.</li>
            <li><strong className="text-rose-400">Prohibited:</strong> Exploiting network desynchronization, packet modification, or artificial latency induction.</li>
            <li><strong className="text-emerald-400">Permitted:</strong> Standard consumer browsers (Chrome, Edge, Firefox, Safari), unassisted physical mice, trackpads, and touch devices.</li>
          </ul>
        </section>

        {/* Section 2 */}
        <section className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 font-display text-base font-bold text-white">
            <span className="w-6 h-6 rounded-md bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs">
              2
            </span>
            <span>Human Physiological Reflex Limit (110ms Rule)</span>
          </div>
          <p>
            Neurological research demonstrates that human motor response to a random visual stimulus cannot occur in less than 110 milliseconds. Any click action arriving at the server in sub-110ms latency is mathematically anomalous and will trigger high-priority telemetry review.
          </p>
        </section>

        {/* Section 3 */}
        <section className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 font-display text-base font-bold text-white">
            <span className="w-6 h-6 rounded-md bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs">
              3
            </span>
            <span>Disconnects, Inactivity & Absence Grace Period</span>
          </div>
          <p>
            Tournaments enforce an automated grace period (default 120 seconds). If a competitor fails to enter the pre-match lobby or experiences network drop exceeding the grace threshold, the server marks the competitor absent and awards a forfeit victory to the opponent with an immutable audit log.
          </p>
        </section>

        {/* Section 4 */}
        <section className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 font-display text-base font-bold text-white">
            <span className="w-6 h-6 rounded-md bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs">
              4
            </span>
            <span>AI Fair-Play Assistant Guardrails & Limitations</span>
          </div>
          <p>
            Our server-side FairPlayAnalyzer evaluates sanitized telemetry (round timing, click intervals, tab focus drops, standard deviation).
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-400 text-xs">
            <li><strong className="text-cyan-300">Explainable Evidence:</strong> AI classifications (NORMAL, REVIEW_REQUIRED, HIGH_RISK) must always cite specific objective telemetry points.</li>
            <li><strong className="text-cyan-300">No Biometrics:</strong> The platform NEVER uses webcam, facial recognition, or microphone data.</li>
            <li><strong className="text-amber-400">Zero Auto-Ban:</strong> AI recommendations never permanently disqualify a player automatically. Human anti-cheat moderators must review the complete evidence ledger before disciplinary actions are enacted.</li>
          </ul>
        </section>

        {/* Section 5 */}
        <section className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 font-display text-base font-bold text-white">
            <span className="w-6 h-6 rounded-md bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs">
              5
            </span>
            <span>Disputes, Appeals & False-Positive Safeguards</span>
          </div>
          <p>
            Competitors have the fundamental right to contest any adverse decision via the Disputes & Appeals Board. If a temporary suspension was triggered by legitimate network packet jitter or peripheral error, the moderator board can void the penalty and restore full competitive rating.
          </p>
        </section>

        {/* Section 6: Terms of Service & Legal Disclaimer */}
        <section className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 font-display text-base font-bold text-white">
            <span className="w-6 h-6 rounded-md bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs">
              6
            </span>
            <span>Terms of Service, Account Eligibility & Liability</span>
          </div>
          <p>
            By creating an account and participating in NEXORA ARENA tournaments, competitors agree to the following terms:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-400 text-xs">
            <li><strong>Eligibility:</strong> Users must be of legal age of majority in their jurisdiction or possess parental consent where required by law.</li>
            <li><strong>Prize Distribution & Taxation:</strong> Tournament prizes are conditional upon fair-play ratification and compliance review. Any confirmed automation or exploitation results in immediate forfeiture of prizes and titles.</li>
            <li><strong>Limitation of Liability:</strong> NEXORA ARENA provides competitive matchmaking "as is" and is not liable for ISP connectivity failures, local hardware latency, or force majeure events impacting match continuity.</li>
            <li><strong>Governing Law:</strong> All terms are governed in accordance with international digital service standards.</li>
          </ul>
        </section>
      </div>
    </div>
  );
};
