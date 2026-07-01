// src/app/models/friend-request.model.ts
export interface FriendRequest {
  id: number;
  accepted: boolean;
  sender: { id: number; firstName: string; lastName: string };
  recipient: { id: number; firstName: string; lastName: string };
}
