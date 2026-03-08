import { useEffect, useState } from 'react';
import { Modal } from '../shared/Modal';
import { getRoomMembers, type RoomMember } from '../../api/roomsApi';
import { Spinner } from '../shared/Spinner';
import { Avatar } from '../shared/Avatar';

interface RoomMembersModalProps {
  roomId: string;
  roomName: string;
  onClose: () => void;
}

export function RoomMembersModal({ roomId, roomName, onClose }: RoomMembersModalProps) {
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getRoomMembers(roomId)
      .then(setMembers)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [roomId]);

  return (
    <Modal title={`Members — #${roomName}`} onClose={onClose}>
      {isLoading ? (
        <div className="members-loading"><Spinner /></div>
      ) : (
        <div>
          {members.map((m) => (
            <div key={m.id} className="dm-item">
              <Avatar username={m.username} avatarUrl={m.avatarUrl} size={28} />
              <span className="dm-item-name">{m.username}</span>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
