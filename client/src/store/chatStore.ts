import { create } from 'zustand';
import type { Room, Message, DirectMessage, DMConversation, TypingUser } from '../types';

type ActiveView =
  | { type: 'room'; roomId: string }
  | { type: 'dm'; userId: string }
  | null;

interface ChatState {
  // Rooms
  rooms: Room[];
  setRooms: (rooms: Room[]) => void;
  addRoom: (room: Room) => void;
  updateRoomMembership: (roomId: string, isMember: boolean) => void;

  // Messages per room
  roomMessages: Record<string, Message[]>;
  addRoomMessage: (roomId: string, message: Message) => void;
  setRoomMessages: (roomId: string, messages: Message[]) => void;
  prependRoomMessages: (roomId: string, messages: Message[]) => void;

  // DM conversations
  conversations: DMConversation[];
  setConversations: (convs: DMConversation[]) => void;

  // DM messages per user
  dmMessages: Record<string, DirectMessage[]>;
  addDMMessage: (userId: string, message: DirectMessage) => void;
  setDMMessages: (userId: string, messages: DirectMessage[]) => void;
  prependDMMessages: (userId: string, messages: DirectMessage[]) => void;

  // Typing indicators
  roomTyping: Record<string, TypingUser[]>;
  setRoomTyping: (roomId: string, userId: string, username: string, isTyping: boolean) => void;
  dmTyping: Record<string, boolean>;
  setDMTyping: (userId: string, isTyping: boolean) => void;

  // Active view
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  // Rooms
  rooms: [],
  setRooms: (rooms) => set({ rooms }),
  addRoom: (room) =>
    set((s) => ({ rooms: s.rooms.some((r) => r.id === room.id) ? s.rooms : [...s.rooms, room] })),
  updateRoomMembership: (roomId, isMember) =>
    set((s) => ({
      rooms: s.rooms.map((r) => (r.id === roomId ? { ...r, isMember } : r)),
    })),

  // Room messages
  roomMessages: {},
  addRoomMessage: (roomId, message) =>
    set((s) => ({
      roomMessages: {
        ...s.roomMessages,
        [roomId]: [...(s.roomMessages[roomId] ?? []), message],
      },
    })),
  setRoomMessages: (roomId, messages) =>
    set((s) => ({ roomMessages: { ...s.roomMessages, [roomId]: messages } })),
  prependRoomMessages: (roomId, messages) =>
    set((s) => ({
      roomMessages: {
        ...s.roomMessages,
        [roomId]: [...messages, ...(s.roomMessages[roomId] ?? [])],
      },
    })),

  // DM conversations
  conversations: [],
  setConversations: (conversations) => set({ conversations }),

  // DM messages
  dmMessages: {},
  addDMMessage: (userId, message) =>
    set((s) => ({
      dmMessages: {
        ...s.dmMessages,
        [userId]: [...(s.dmMessages[userId] ?? []), message],
      },
    })),
  setDMMessages: (userId, messages) =>
    set((s) => ({ dmMessages: { ...s.dmMessages, [userId]: messages } })),
  prependDMMessages: (userId, messages) =>
    set((s) => ({
      dmMessages: {
        ...s.dmMessages,
        [userId]: [...messages, ...(s.dmMessages[userId] ?? [])],
      },
    })),

  // Typing
  roomTyping: {},
  setRoomTyping: (roomId, userId, username, isTyping) =>
    set((s) => {
      const current = s.roomTyping[roomId] ?? [];
      const filtered = current.filter((u) => u.userId !== userId);
      return {
        roomTyping: {
          ...s.roomTyping,
          [roomId]: isTyping ? [...filtered, { userId, username }] : filtered,
        },
      };
    }),

  dmTyping: {},
  setDMTyping: (userId, isTyping) =>
    set((s) => ({ dmTyping: { ...s.dmTyping, [userId]: isTyping } })),

  // Active view
  activeView: null,
  setActiveView: (activeView) => set({ activeView }),
}));
