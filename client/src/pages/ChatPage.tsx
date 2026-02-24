import { MainLayout } from '../components/layout/MainLayout';
import { ChatWindow } from '../components/chat/ChatWindow';
import { DMWindow } from '../components/dm/DMWindow';
import { useChatStore } from '../store/chatStore';
import { useRooms } from '../hooks/useRooms';

export function ChatPage() {
  const activeView = useChatStore((s) => s.activeView);
  const { rooms } = useRooms();

  const renderContent = () => {
    if (!activeView) {
      return (
        <div className="chat-welcome">
          <h2>Welcome to Chatter</h2>
          <p>Select a room or start a direct message from the sidebar.</p>
        </div>
      );
    }

    if (activeView.type === 'room') {
      const room = rooms.find((r) => r.id === activeView.roomId);
      if (!room) return null;
      return <ChatWindow roomId={room.id} roomName={room.name} />;
    }

    if (activeView.type === 'dm') {
      // Find the partner from conversations in store
      return <DMWindowWrapper partnerId={activeView.userId} />;
    }

    return null;
  };

  return <MainLayout>{renderContent()}</MainLayout>;
}

function DMWindowWrapper({ partnerId }: { partnerId: string }) {
  const conversations = useChatStore((s) => s.conversations);
  const partner = conversations.find((c) => c.id === partnerId);

  // If no conversation exists yet (new DM), we still open the window
  return (
    <DMWindow
      partnerId={partnerId}
      partnerUsername={partner?.username ?? partnerId}
      partnerAvatarUrl={partner?.avatarUrl}
    />
  );
}
