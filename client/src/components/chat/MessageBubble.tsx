import { Avatar } from '../shared/Avatar';
import type { Message, DirectMessage } from '../../types';

type AnyMessage = Message | DirectMessage;

function isRoomMessage(m: AnyMessage): m is Message {
  return 'roomId' in m;
}

interface MessageBubbleProps {
  message: AnyMessage;
  currentUserId: string;
}

export function MessageBubble({ message, currentUserId }: MessageBubbleProps) {
  const author = isRoomMessage(message) ? message.author : message.sender;
  const isOwn = author.id === currentUserId;
  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className={`message ${isOwn ? 'message-own' : ''}`}>
      {!isOwn && <Avatar username={author.username} avatarUrl={author.avatarUrl} size={32} />}
      <div className="message-content">
        {!isOwn && <span className="message-author">{author.username}</span>}
        <div className="message-bubble">
          <span className="message-text">{message.content}</span>
          <span className="message-time">{time}</span>
        </div>
      </div>
      {isOwn && <Avatar username={author.username} avatarUrl={author.avatarUrl} size={32} />}
    </div>
  );
}
