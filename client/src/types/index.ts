export interface User {
  id: string;
  username: string;
  email: string;
  avatarUrl: string | null;
}

export interface Room {
  id: string;
  name: string;
  description: string | null;
  isPrivate: boolean;
  memberCount?: number;
  isMember?: boolean;
}

export interface MessageAuthor {
  id: string;
  username: string;
  avatarUrl: string | null;
}

export interface Message {
  id: string;
  content: string;
  createdAt: string;
  editedAt: string | null;
  author: MessageAuthor;
  roomId: string;
}

export interface DirectMessage {
  id: string;
  content: string;
  createdAt: string;
  readAt: string | null;
  sender: MessageAuthor;
  receiver: MessageAuthor;
}

export interface DMConversation {
  id: string;
  username: string;
  avatarUrl: string | null;
  lastAt: string;
}

export interface TypingUser {
  userId: string;
  username: string;
}
