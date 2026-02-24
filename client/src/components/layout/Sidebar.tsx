import { useState } from 'react';
import { RoomList } from '../rooms/RoomList';
import { DMList } from '../dm/DMList';
import { CreateRoomModal } from '../rooms/CreateRoomModal';
import { RoomBrowser } from '../rooms/RoomBrowser';
import { Modal } from '../shared/Modal';
import { Input } from '../shared/Input';
import { Button } from '../shared/Button';
import { Avatar } from '../shared/Avatar';
import { useChatStore } from '../../store/chatStore';
import { useRooms } from '../../hooks/useRooms';
import * as dmApi from '../../api/dmApi';
import type { User } from '../../types';

type SidebarModal = 'none' | 'browse' | 'create' | 'search';

export function Sidebar() {
  const [modal, setModal] = useState<SidebarModal>('none');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const setActiveView = useChatStore((s) => s.setActiveView);
  useRooms(); // ensures rooms are fetched

  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    if (!q.trim()) { setSearchResults([]); return; }
    setIsSearching(true);
    try {
      const users = await dmApi.searchUsers(q);
      setSearchResults(users);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const openDM = (user: User) => {
    setActiveView({ type: 'dm', userId: user.id });
    setModal('none');
    setSearchQuery('');
    setSearchResults([]);
  };

  return (
    <aside className="sidebar">
      <RoomList onBrowse={() => setModal('browse')} />
      <DMList onSearchUser={() => setModal('search')} />

      {modal === 'browse' && (
        <Modal title="Rooms" onClose={() => setModal('none')}>
          <Button variant="primary" onClick={() => setModal('create')} style={{ marginBottom: 16 }}>
            + Create Room
          </Button>
          <RoomBrowser />
        </Modal>
      )}

      {modal === 'create' && (
        <CreateRoomModal onClose={() => setModal('none')} />
      )}

      {modal === 'search' && (
        <Modal title="New Direct Message" onClose={() => { setModal('none'); setSearchQuery(''); setSearchResults([]); }}>
          <Input
            id="user-search"
            placeholder="Search by username…"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            autoFocus
          />
          <div style={{ marginTop: 8 }}>
            {isSearching && <p className="sidebar-empty">Searching…</p>}
            {!isSearching && searchResults.length === 0 && searchQuery && (
              <p className="sidebar-empty">No users found</p>
            )}
            {searchResults.map((u) => (
              <button
                key={u.id}
                className="search-result-item"
                onClick={() => openDM(u)}
              >
                <Avatar username={u.username} avatarUrl={u.avatarUrl} size={28} />
                <span>{u.username}</span>
              </button>
            ))}
          </div>
        </Modal>
      )}
    </aside>
  );
}
