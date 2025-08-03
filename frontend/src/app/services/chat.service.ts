import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

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
}
