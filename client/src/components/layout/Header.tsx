import { useAuth } from '../../hooks/useAuth';
import { Avatar } from '../shared/Avatar';
import { Button } from '../shared/Button';

export function Header() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <header className="header">
      <div className="header-brand">Chatter</div>
      <div className="header-user">
        <Avatar username={user.username} avatarUrl={user.avatarUrl} size={32} />
        <span className="header-username">{user.username}</span>
        <Button variant="ghost" onClick={logout}>Sign out</Button>
      </div>
    </header>
  );
}
