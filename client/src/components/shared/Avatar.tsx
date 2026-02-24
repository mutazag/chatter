interface AvatarProps {
  username: string;
  avatarUrl?: string | null;
  size?: number;
}

export function Avatar({ username, avatarUrl, size = 36 }: AvatarProps) {
  const initials = username.slice(0, 2).toUpperCase();

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={username}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }}
      />
    );
  }

  // Generate a deterministic hue from username
  let hash = 0;
  for (const ch of username) hash = (hash * 31 + ch.charCodeAt(0)) & 0xffffffff;
  const hue = Math.abs(hash) % 360;

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: `hsl(${hue}, 55%, 50%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontWeight: 600,
        fontSize: size * 0.38,
        flexShrink: 0,
        userSelect: 'none',
      }}
    >
      {initials}
    </div>
  );
}
