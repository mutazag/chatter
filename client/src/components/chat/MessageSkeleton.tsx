// Alternating shimmer bubbles that mimic a real conversation layout
const PATTERN: { own: boolean; width: string }[] = [
  { own: false, width: '60%' },
  { own: true,  width: '42%' },
  { own: false, width: '75%' },
  { own: true,  width: '55%' },
  { own: false, width: '38%' },
];

export function MessageSkeleton() {
  return (
    <div className="message-skeleton">
      {PATTERN.map((p, i) => (
        <div key={i} className={`message-skeleton-row ${p.own ? 'own' : ''}`}>
          {!p.own && <div className="skeleton message-skeleton-avatar" />}
          <div className="message-skeleton-bubble-wrap" style={{ maxWidth: p.width }}>
            {!p.own && <div className="skeleton message-skeleton-name" />}
            <div className="skeleton message-skeleton-bubble" />
          </div>
          {p.own && <div className="skeleton message-skeleton-avatar" />}
        </div>
      ))}
    </div>
  );
}
