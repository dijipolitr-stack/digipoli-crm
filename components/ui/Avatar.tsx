// components/ui/Avatar.tsx
'use client';

interface Props { name: string; size?: number; }

const COLORS: [string, string][] = [
  ['#4f8ef7', 'rgba(79,142,247,0.15)'],
  ['#7c5cfc', 'rgba(124,92,252,0.15)'],
  ['#22c55e', 'rgba(34,197,94,0.15)'],
  ['#f59e0b', 'rgba(245,158,11,0.15)'],
  ['#06b6d4', 'rgba(6,182,212,0.15)'],
  ['#a855f7', 'rgba(168,85,247,0.15)'],
];

export default function Avatar({ name, size = 32 }: Props) {
  const initials = (name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const [c, bg] = COLORS[(name || '').charCodeAt(0) % COLORS.length];
  return (
    <div
      className="avatar"
      style={{
        width: size, height: size,
        fontSize: size * 0.35,
        background: bg,
        border: `1.5px solid ${c}33`,
        color: c,
      }}
    >
      {initials}
    </div>
  );
}
