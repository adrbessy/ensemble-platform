export type ConversationType = 'PRIVATE' | 'GROUP';

export interface UserSummaryDTO {
  id: number;
  firstName: string;
  lastName: string;
  photoFilename?: string | null;
}

export interface MessageLiteDTO {
  id: number;
  content: string;
  timestamp: string;  // ISO
  sender: UserSummaryDTO;
}

export interface ConversationDTO {
  id: number;
  name: string | null;
  type: ConversationType;
  participants: UserSummaryDTO[];
  lastMessage?: MessageLiteDTO | null;
  canWrite?: boolean; 
  eventId?: number; 
}
