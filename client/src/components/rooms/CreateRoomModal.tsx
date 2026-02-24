import { useState } from 'react';
import { Modal } from '../shared/Modal';
import { Input } from '../shared/Input';
import { Button } from '../shared/Button';
import { useRooms } from '../../hooks/useRooms';
import { useChatStore } from '../../store/chatStore';
import axios from 'axios';

interface CreateRoomModalProps {
  onClose: () => void;
}

export function CreateRoomModal({ onClose }: CreateRoomModalProps) {
  const { createRoom } = useRooms();
  const setActiveView = useChatStore((s) => s.setActiveView);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const room = await createRoom(name, description || undefined, isPrivate);
      setActiveView({ type: 'room', roomId: room.id });
      onClose();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message ?? 'Failed to create room');
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal title="Create Room" onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Input
          id="room-name"
          label="Room name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="general"
          maxLength={64}
        />
        <Input
          id="room-desc"
          label="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What's this room about?"
        />
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={isPrivate}
            onChange={(e) => setIsPrivate(e.target.checked)}
          />
          Private room
        </label>
        {error && <p className="auth-error">{error}</p>}
        <Button type="submit" isLoading={isLoading}>Create Room</Button>
      </form>
    </Modal>
  );
}
