import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject, firstValueFrom, combineLatest, map, distinctUntilChanged, shareReplay  } from 'rxjs';

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
  readiness$ = new BehaviorSubject<boolean>(false);
  private unreadMessagesSubject = new BehaviorSubject<Set<number>>(new Set());
  unreadConversations$ = this.unreadMessagesSubject.asObservable();

  // 👇 observable déjà prêt à consommer dans la navbar
  badge$: Observable<boolean> = combineLatest([this.readiness$, this.unreadConversations$]).pipe(
    map(([ready, set]) => !!ready && set.size > 0),
    distinctUntilChanged(),
    shareReplay(1) // ✨ retient la dernière valeur pour les abonnés tardifs
  );

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

    const fromOther = (msg.senderId ?? msg.sender?.id) !== this.currentUserId;
    if (fromOther) {
      this.unreadConversationIds.add(msg.conversationId);
      this.unreadMessagesSubject.next(new Set(this.unreadConversationIds));
    }
  }

  private unreadConversationIds = new Set<number>();

  notifyUnreadForConversation(convId: number) {
    this.unreadConversationIds.add(convId);
    this.unreadMessagesSubject.next(new Set(this.unreadConversationIds));
  }

  clearUnreadForConversation(convId: number) {
    this.unreadConversationIds.delete(convId);
    console.log('✅ Lecture conversation', convId);
    this.unreadMessagesSubject.next(new Set(this.unreadConversationIds));
  }

  getUnreadConversations$(): Observable<Set<number>> {
    return this.unreadMessagesSubject.asObservable();
  }

  // chat.service.ts
  currentUserId!: number;

  setCurrentUserId(id: number) {
    this.currentUserId = id;
  }

  private localReadMap = new Map<number, string>(); // conversationId → ISO timestamp

  markAsReadLocally(convId: number, timestamp: string) {
    // on stocke au format normalisé
    this.localReadMap.set(convId, this.normalizeIso(timestamp));
    this.clearUnreadForConversation(convId);
  }

  wasReadLocally(convId: number, lastMessageTime: string): boolean {
    const lastRead = this.localReadMap.get(convId);
    if (!lastRead) return false;
    return this.toMillis(lastMessageTime) <= this.toMillis(lastRead);
  }

  markAsReadOnServer(conversationId: number, timestamp: string): Observable<any> {
    // on envoie normalisé (SSS)
    const ts = this.normalizeIso(timestamp);
    return this.http.post(`/api/chat/read-status/${conversationId}`, { timestamp: ts }, { withCredentials: true });
  }

  getAllReadStatuses(): Observable<{ [convId: number]: string }> {
    return this.http.get<{ [convId: number]: string }>('/api/chat/read-status', {
      withCredentials: true
    });
  }

  resetUnread() {
    this.unreadConversationIds.clear();
    this.unreadMessagesSubject.next(new Set(this.unreadConversationIds));
  }

    // ---- UTIL ----
  private toMillis(ts: string | undefined | null): number {
    if (!ts) return 0;
    // force YYYY-MM-DDTHH:mm:ss.SSSZ (3 décimales)
    const m = ts.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(\.\d+)?Z$/);
    if (m) {
      const base = m[1];
      const frac = (m[2]?.slice(1) ?? '000').slice(0, 3).padEnd(3, '0');
      ts = `${base}.${frac}Z`;
    }
    return Date.parse(ts);
  }

  // expose une aide si tu veux l’utiliser côté composant
  normalizeIso(ts: string): string {
    const m = ts.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(\.\d+)?Z$/);
    if (!m) return ts;
    const base = m[1];
    const frac = (m[2]?.slice(1) ?? '000').slice(0, 3).padEnd(3, '0');
    return `${base}.${frac}Z`;
  }

  resetAllStates() {
    this.unreadConversationIds.clear();
    this.unreadMessagesSubject.next(new Set());
    this.localReadMap.clear();
    this.currentUserId = undefined as any; // ou 0 / null selon ton typage
    this.readiness$.next(false);
  }

  async initForUser(userId: number) {
    this.resetAllStates();
    this.setCurrentUserId(userId);
    const statusMap = await firstValueFrom(this.getAllReadStatuses());
    for (const [convId, ts] of Object.entries(statusMap)) {
      this.markAsReadLocally(+convId, ts);
    }
    // 2) construire le set des non-lus à partir des conversations
    await this.refreshUnreadFromServer();
    this.unreadMessagesSubject.next(new Set(this.unreadConversationIds));
    this.readiness$.next(true);
  }

  /** Recalcule le badge “non-lus” sans ouvrir la Messagerie */
async refreshUnreadFromServer(): Promise<void> {
  const convos = await firstValueFrom(this.getConversations());
  const nextSet = new Set<number>();

  for (const conv of convos) {
    const last = conv.lastMessage; // ConversationDTO.lastMessage
    if (!last) continue;

    const ts = this.normalizeIso(last.timestamp);
    const senderId = last.sender?.id ?? last.senderId;

    // non-lu = message du correspondant ET ts > lastRead
    const alreadyRead = this.wasReadLocally(conv.id, ts);
    if (senderId !== this.currentUserId && !alreadyRead) {
      nextSet.add(conv.id);
    }
  }

  this.unreadConversationIds = nextSet;
  this.unreadMessagesSubject.next(new Set(nextSet));
}


}
