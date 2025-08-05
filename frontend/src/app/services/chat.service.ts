import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';

export interface Message {
  id: number;
  senderId: number;
  recipientId: number;
  content: string;
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {

  private apiUrl = '/api';

  constructor(private http: HttpClient) {}

  sendMessage(recipientId: number, content: string): Observable<any> {
    const body = { recipientId, content };

    return this.http.post('/api/messages', body, {
      withCredentials: true // ✅ important si token dans cookie
      // headers: new HttpHeaders({ 'Authorization': `Bearer ${token}` }) // si besoin
    });
  }

  getMessages(friendId: number): Observable<Message[]> {
    return this.http.get<Message[]>(`/api/messages/with/${friendId}`, {
      withCredentials: true // ✅ idem ici
    });
  }

  createGroupConversation(data: { name: string; userIds: number[] }) {
    return this.http.post(`${this.apiUrl}/chat/conversations/group`, data, {
      withCredentials: true
    });
  }

  getConversations(): Observable<any[]> {
    return this.http.get<any[]>('/api/chat/conversations', {
      withCredentials: true
    });
  }

  sendMessageToConversation(conversationId: number, content: string): Observable<any> {
    return this.http.post(`/api/chat/conversations/${conversationId}/messages`, { content }, {
      withCredentials: true
    });
  }

  getMessagesByConversation(conversationId: number): Observable<Message[]> {
    return this.http.get<Message[]>(`/api/messages/conversation/${conversationId}`, {
      withCredentials: true
    });
  }

  addMembersToConversation(conversationId: number, userIds: number[]) {
    return this.http.post(`/api/chat/conversations/${conversationId}/add-members`, userIds, {
      withCredentials: true
    });
  }

  getOrCreatePrivateConversation(otherUserId: number) {
    return this.http.post<any>('/api/chat/conversations/private', otherUserId, {
      withCredentials: true
    });
  }

  private messageSubject = new Subject<any>();

  onMessageReceived(): Observable<any> {
    return this.messageSubject.asObservable();
  }

  // Appelle ceci quand un message est reçu via WebSocket :
  handleIncomingMessage(msg: any) {
    this.messageSubject.next(msg);
  }



}
