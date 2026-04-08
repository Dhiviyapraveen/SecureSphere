import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => (
  <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.18),_transparent_28%),linear-gradient(180deg,_#04111d,_#0f172a_48%,_#111827)]">
    <div className="mx-auto max-w-7xl px-4 py-24">
      <div className="grid items-center gap-12 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.35em] text-cyan-300">SecureSphere for Telemedicine</p>
          <h1 className="text-5xl font-bold leading-tight text-white md:text-6xl">
            Secure file sharing for doctors, patients, and remote care teams
          </h1>
          <p className="mt-6 max-w-3xl text-lg text-slate-300">
            Upload scans, prescriptions, and consultation reports with chunked transfer, streaming AES-256 encryption, short-lived JWT sessions, and audit-ready access tracking.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link to="/register" className="rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-8 py-3 font-semibold text-slate-950 transition hover:brightness-110">
              Create Healthcare Account
            </Link>
            <Link to="/login" className="rounded-2xl bg-slate-800 px-8 py-3 font-semibold text-white transition hover:bg-slate-700">
              Sign In
            </Link>
          </div>
        </div>

        <div className="rounded-[2rem] border border-cyan-500/20 bg-slate-900/80 p-8 shadow-2xl">
          <div className="grid gap-4">
            {[
              'MITM-aware secure headers and HTTPS enforcement',
              'Replay attack protection with nonce and timestamp validation',
              'Doctor, patient, and admin role-based access control',
              'Chunked uploads for large medical records',
              'Full audit history for downloads, shares, and access reviews'
            ].map((item) => (
              <div key={item} className="rounded-2xl border border-slate-700 bg-slate-800 p-4 text-slate-200">
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default Home;
