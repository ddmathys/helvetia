/** Anneau de progression (indice de connaissance, 0–100). */
export function RingIndex({ value, label, size = 120 }: { value: number; label: string; size?: number }) {
  const r = 52, c = 2 * Math.PI * r;
  return (
    <div className="ring-index" style={{ width: size, height: size }} role="img" aria-label={`${label} ${value} %`}>
      <svg viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} fill="none" stroke="var(--line)" strokeWidth="10" />
        <circle cx="60" cy="60" r={r} fill="none" stroke="url(#ringgrad)" strokeWidth="10" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)} style={{ transition: 'stroke-dashoffset 1s cubic-bezier(.2,.8,.2,1)' }} />
        <defs><linearGradient id="ringgrad" x1="0" x2="1"><stop offset="0" stopColor="#e2453c" /><stop offset="1" stopColor="#f2c46d" /></linearGradient></defs>
      </svg>
      <div className="v"><div><b>{value}<span style={{ fontSize: '.5em' }}>%</span></b><small>{label}</small></div></div>
    </div>
  );
}
