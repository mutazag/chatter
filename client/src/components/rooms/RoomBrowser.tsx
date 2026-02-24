import { useState } from 'react';
import { useRooms } from '../../hooks/useRooms';
import { useChatStore } from '../../store/chatStore';
import { Button } from '../shared/Button';
import axios from 'axios';

export function RoomBrowser() {
  const { rooms, joinRoom } = useRooms();
  const setActiveView = useChatStore((s) => s.setActiveView);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const publicRooms = rooms.filter((r) => !r.isPrivate && !r.isMember);

  const handleJoin = async (roomId: string) => {
    setJoiningId(roomId);
    try {
      await joinRoom(roomId);
      setActiveView({ type: 'room', roomId });
    } catch (err) {
      if (axios.isAxiosError(err)) {
        alert(err.response?.data?.message ?? 'Failed to join room');
      }
    } finally {
      setJoiningId(null);
    }
  };

  if (publicRooms.length === 0) {
    return <p className="empty-state">No other public rooms to browse.</p>;
  }

  return (
    <div className="room-browser">
      <h3 className="section-title">Browse Rooms</h3>
      {publicRooms.map((room) => (
        <div key={room.id} className="room-browser-item">
          <div>
            <span className="room-name"># {room.name}</span>
            {room.description && <p className="room-desc">{room.description}</p>}
            <span className="room-member-count">{room.memberCount ?? 0} members</span>
          </div>
          <Button
            variant="secondary"
            onClick={() => handleJoin(room.id)}
            isLoading={joiningId === room.id}
          >
            Join
          </Button>
        </div>
      ))}
    </div>
  );
}
