import React from 'react';
import { Lock, ShieldCheck, EyeOff, FileText, CheckCircle2, UserCheck, Trash2, Mail } from 'lucide-react';

export const PrivacyConsentPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <div className="border-b border-slate-800 pb-6 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-950/60 border border-violet-500/40 text-violet-300 text-xs font-semibold uppercase mb-4">
          <Lock className="w-3.5 h-3.5" />
          <span>Data Privacy & Consent Charter</span>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-white">
          Privacy Policy & Telemetry Consent
        </h1>
        <p className="text-xs text-slate-400 mt-2 max-w-xl mx-auto">
          Transparency by design: how NEXORA ARENA isolates competitor PII, limits match telemetry, and protects personal identity under GDPR, CCPA, and global esports privacy standards.
        </p>
      </div>

      <div className="space-y-6 text-xs sm:text-sm text-slate-300 leading-relaxed">
        {/* Section 1 */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <h3 className="font-display font-bold text-base text-white flex items-center gap-2">
            <EyeOff className="w-5 h-5 text-cyan-400" />
            <span>1. Anonymous Competitive Identity Protection</span>
          </h3>
          <p>
            During tournament matches, pre-match lobbies, and live scoreboards, opponents never receive access to your real name, email address, IP address, device specs, or linked social accounts. You are represented exclusively by an anonymized alias (e.g., <span className="font-mono text-cyan-300">Player-4821</span>).
          </p>
        </div>

        {/* Section 2 */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <h3 className="font-display font-bold text-base text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span>2. Strict Anti-Cheating Telemetry Scope</span>
          </h3>
          <p>
            To verify reaction fairness, the platform collects ONLY the minimum essential mathematical telemetry:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-400 text-xs">
            <li>Target display millisecond timestamp and client click arrival timestamp (for reaction latency calculation).</li>
            <li>Grid coordinate index clicked (0 to 15 on the 4x4 canvas).</li>
            <li>Browser tab visibility events (to register if the browser was minimized or switched during active rounds).</li>
            <li>Client-to-server clock skew delta (to prevent local timer manipulation).</li>
          </ul>
        </div>

        {/* Section 3 */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <h3 className="font-display font-bold text-base text-white flex items-center gap-2">
            <Lock className="w-5 h-5 text-rose-400" />
            <span>3. Non-Invasive Anti-Cheat Pledge</span>
          </h3>
          <p>
            Unlike intrusive kernel-level rootkits or invasive monitoring software, NEXORA ARENA operates entirely within standard browser web sandboxes:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-400 text-xs">
            <li>We <strong className="text-white">NEVER</strong> access your webcam, camera, or facial recognition.</li>
            <li>We <strong className="text-white">NEVER</strong> access your microphone or record ambient audio.</li>
            <li>We <strong className="text-white">NEVER</strong> install kernel drivers or scan external files on your hard drive.</li>
          </ul>
        </div>

        {/* Section 4 */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <h3 className="font-display font-bold text-base text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-violet-400" />
            <span>4. Telemetry Retention & Audit Log Lifecycle</span>
          </h3>
          <p>
            Sanitized match event logs are retained for 30 days to facilitate dispute resolution and tournament bracket verification. Once a tournament outcome is ratified and prizes distributed, detailed sub-millisecond click event records are securely purged.
          </p>
        </div>

        {/* Section 5: Data Subject Rights (GDPR & CCPA) */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <h3 className="font-display font-bold text-base text-white flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-amber-400" />
            <span>5. Data Subject Rights & Deletion Requests</span>
          </h3>
          <p>
            Under GDPR (Articles 15–22) and CCPA, you have the right to request access to, rectification of, or erasure of your personal data. To submit a verifiable consumer request or data deletion request:
          </p>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-xs font-mono text-cyan-300">
            <span>Data Protection Officer: privacy@nexora.arena</span>
            <span className="text-slate-500">Response SLA: &lt; 30 Days</span>
          </div>
        </div>
      </div>
    </div>
  );
};
