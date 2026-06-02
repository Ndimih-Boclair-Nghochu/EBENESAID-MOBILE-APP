import type { SafeUser, UserType } from '@/src/types';

export interface MessageParticipant {
  userId: number;
  name: string;
  userType: UserType | string;
}

export interface ConversationSummary {
  id: number;
  participants: MessageParticipant[];
  lastMessage: {
    content: string;
    sentAt: string;
    senderUserId: number;
  };
  unreadCount: number;
  subject: string | null;
}

export interface MessagesResponse {
  conversations: ConversationSummary[];
}

export interface ConversationMessage {
  id: number | string;
  content: string;
  sentAt: string;
  senderUserId: number;
  senderName?: string;
  pending?: boolean;
}

export interface ConversationDetailResponse {
  conversation: ConversationSummary;
  messages: ConversationMessage[];
}

export interface CommunityCircleMessage {
  id: number | string;
  content: string;
  senderName: string;
  sentAt: string;
  pending?: boolean;
}

export interface CommunityCircle {
  id: number;
  name: string;
  description: string;
  memberCount: number;
  joined: boolean;
  messages: CommunityCircleMessage[];
}

export interface CommunityEvent {
  id: number;
  title: string;
  date: string;
  location: string;
  description: string;
}

export interface BuddyMatch {
  userId: number;
  name: string;
  university: string;
  countryOfOrigin: string;
  interests: string[] | string;
}

export interface CommunityResponse {
  circles: CommunityCircle[];
  events: CommunityEvent[];
  buddyMatches: BuddyMatch[];
}

export const phase3QueryTimes = {
  messages: {
    staleTime: 1000 * 60,
    gcTime: 1000 * 60 * 20,
    refetchInterval: 30000
  },
  conversation: {
    staleTime: 1000 * 20,
    gcTime: 1000 * 60 * 10
  },
  community: {
    staleTime: 1000 * 60 * 3,
    gcTime: 1000 * 60 * 30
  },
  circle: {
    staleTime: 1000 * 20,
    gcTime: 1000 * 60 * 10,
    refetchInterval: 20000
  }
} as const;

export function getOtherParticipant(
  participants: MessageParticipant[],
  user: SafeUser | null
): MessageParticipant {
  return (
    participants.find((participant) => participant.userId !== user?.id) ??
    participants[0] ?? {
      userId: 0,
      name: 'EBENESAID',
      userType: 'staff'
    }
  );
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return 'E';
  }

  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase();
}

export function sortMessagesNewestFirst<T extends { sentAt: string }>(messages: T[]): T[] {
  return [...messages].sort((a, b) => Date.parse(b.sentAt) - Date.parse(a.sentAt));
}

export function extractConversationId(data: unknown): number | null {
  if (!data || typeof data !== 'object') {
    return null;
  }

  if ('conversationId' in data && typeof data.conversationId === 'number') {
    return data.conversationId;
  }

  if ('id' in data && typeof data.id === 'number') {
    return data.id;
  }

  if ('conversation' in data) {
    const conversation = data.conversation;

    if (conversation && typeof conversation === 'object' && 'id' in conversation) {
      const id = conversation.id;
      return typeof id === 'number' ? id : null;
    }
  }

  return null;
}

export function normalizeParticipantSearch(value: string): string {
  return value.trim().toLowerCase();
}

