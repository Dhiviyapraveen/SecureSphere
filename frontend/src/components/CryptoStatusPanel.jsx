import React from 'react';

const statusStyles = {
  pending: 'border-slate-700 bg-slate-900 text-slate-400',
  active: 'border-cyan-400 bg-cyan-400/10 text-cyan-200',
  complete: 'border-emerald-400 bg-emerald-400/10 text-emerald-200'
};

const CryptoStatusPanel = ({ title = 'Cryptography Pipeline', steps = [], footer = '' }) => (
  <div className="rounded-3xl border border-slate-700 bg-slate-800 p-6">
    <h3 className="text-xl font-semibold text-white">{title}</h3>
    <div className="mt-5 grid gap-3">
      {steps.map((step, index) => (
        <div
          key={step.label}
          className={`rounded-2xl border p-4 ${statusStyles[step.state] || statusStyles.pending}`}
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em]">{String(index + 1).padStart(2, '0')}</p>
              <p className="mt-1 text-base font-medium">{step.label}</p>
            </div>
            <span className="text-xs uppercase tracking-[0.2em]">
              {step.state === 'complete' ? 'Complete' : step.state === 'active' ? 'Active' : 'Pending'}
            </span>
          </div>
          {step.detail ? <p className="mt-2 text-sm opacity-90">{step.detail}</p> : null}
        </div>
      ))}
    </div>
    {footer ? <p className="mt-4 text-sm text-slate-400">{footer}</p> : null}
  </div>
);

export default CryptoStatusPanel;
