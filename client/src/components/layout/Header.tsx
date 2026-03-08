import { useAuth } from '../../hooks/useAuth';
import { useUiStore } from '../../store/uiStore';
import { Avatar } from '../shared/Avatar';
import { Button } from '../shared/Button';

function SidebarToggleIcon({ open }: { open: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      {open ? (
        // Panel with left section filled — click to collapse
        <>
          <rect x="1" y="2" width="14" height="12" rx="2" />
          <line x1="5.5" y1="2" x2="5.5" y2="14" />
        </>
      ) : (
        // Panel with left section collapsed — click to expand
        <>
          <rect x="1" y="2" width="14" height="12" rx="2" />
          <line x1="5.5" y1="2" x2="5.5" y2="14" strokeDasharray="2 1.5" />
        </>
      )}
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="8" cy="8" r="2.8" />
      <line x1="8" y1="1" x2="8" y2="3" />
      <line x1="8" y1="13" x2="8" y2="15" />
      <line x1="1" y1="8" x2="3" y2="8" />
      <line x1="13" y1="8" x2="15" y2="8" />
      <line x1="3.05" y1="3.05" x2="4.46" y2="4.46" />
      <line x1="11.54" y1="11.54" x2="12.95" y2="12.95" />
      <line x1="12.95" y1="3.05" x2="11.54" y2="4.46" />
      <line x1="4.46" y1="11.54" x2="3.05" y2="12.95" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M6.5 2a6 6 0 1 0 7.5 7.5A4.5 4.5 0 0 1 6.5 2z" />
    </svg>
  );
}

export function Header() {
  const { user, logout } = useAuth();
  const { theme, sidebarOpen, toggleTheme, toggleSidebar } = useUiStore();

  if (!user) return null;

  return (
    <header className="header">
      <div className="header-left">
        <button
          className="icon-btn"
          onClick={toggleSidebar}
          aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          <SidebarToggleIcon open={sidebarOpen} />
        </button>
        <div className="header-brand">Chatter</div>
      </div>
      <div className="header-user">
        <button
          className="icon-btn"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </button>
        <Avatar username={user.username} avatarUrl={user.avatarUrl} size={32} />
        <span className="header-username">{user.username}</span>
        <Button variant="ghost" onClick={logout}>Sign out</Button>
      </div>
    </header>
  );
}
