export interface EventInvite {
  id: number;
  eventId: number;
  eventTitle: string;
  inviterName: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  createdAt?: string;           // ISO string (optionnel mais utile)
  readAt?: string | null;       // ⬅️ IMPORTANT : null = non lu
}
