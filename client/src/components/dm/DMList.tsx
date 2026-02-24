import { useDMs } from '../../hooks/useDMs';
import { useChatStore } from '../../store/chatStore';
import { Avatar } from '../shared/Avatar';

interface DMListProps {
  onSearchUser: () => void;
}

export function DMList({ onSearchUser }: DMListProps) {
  const setActiveView = useChatStore((s) => s.setActiveView);
  const activeView = useChatStore((s) => s.activeView);
  const { conversations } = useDMs(null);

  return (
    <div className="dm-list">
      <div className="section-header">
        <span className="section-title">Direct Messages</span>
        <button className="icon-btn" onClick={onSearchUser} title="New DM">+</button>
      </div>
      {conversations.length === 0 && (
        <p className="sidebar-empty">No DMs yet</p>
      )}
      {conversations.map((conv) => (
        <button
          key={conv.id}
          className={`dm-item ${activeView?.type === 'dm' && activeView.userId === conv.id ? 'active' : ''}`}
          onClick={() => setActiveView({ type: 'dm', userId: conv.id })}
        >
          <Avatar username={conv.username} avatarUrl={conv.avatarUrl} size={28} />
          <span className="dm-item-name">{conv.username}</span>
        </button>
      ))}
    </div>
  );
}
