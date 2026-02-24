import { useChatStore } from '../../store/chatStore';
import { useRooms } from '../../hooks/useRooms';

interface RoomListProps {
  onBrowse: () => void;
}

export function RoomList({ onBrowse }: RoomListProps) {
  const setActiveView = useChatStore((s) => s.setActiveView);
  const activeView = useChatStore((s) => s.activeView);
  const { rooms } = useRooms();
  const myRooms = rooms.filter((r) => r.isMember);

  return (
    <div className="room-list">
      <div className="section-header">
        <span className="section-title">Rooms</span>
        <button className="icon-btn" onClick={onBrowse} title="Browse / Create rooms">+</button>
      </div>
      {myRooms.length === 0 && (
        <p className="sidebar-empty">Join a room to get started</p>
      )}
      {myRooms.map((room) => (
        <button
          key={room.id}
          type="button"
          className={`room-item ${activeView?.type === 'room' && activeView.roomId === room.id ? 'active' : ''}`}
          onClick={() => setActiveView({ type: 'room', roomId: room.id })}
        >
          <span className="room-hash">#</span>
          <span className="room-item-name">{room.name}</span>
        </button>
      ))}
    </div>
  );
}
