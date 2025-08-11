import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject, firstValueFrom, combineLatest, map, distinctUntilChanged, shareReplay  } from 'rxjs';
import { ConversationDTO } from '../models/chat.models';
import { dbg } from '../debug';

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

  private initToken = 0;
  private inFlightInit?: Promise<void>;

  private storageKey(userId: number) { return `chat:read:${userId}`; }

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
    return this.http.post<ConversationDTO>(`${this.apiUrl}/chat/conversations/group`, data, {
      withCredentials: true
    });
  }

  getConversations(): Observable<ConversationDTO[]> {
    return this.http.get<ConversationDTO[]>('/api/chat/conversations', { withCredentials: true });
  }

  sendMessageToConversation(conversationId: number, content: string): Observable<any> {
    return this.http.post(`/api/chat/conversations/${conversationId}/messages`, { content }, {
      withCredentials: true
    });
  }

  getMessagesByConversation(conversationId: number) {
    return this.http.get<Message[]>(`/api/messages/conversation/${conversationId}`, { withCredentials: true });
  }

  addMembersToConversation(conversationId: number, userIds: number[]) {
    return this.http.post<ConversationDTO>( // ✅ typé
      `/api/chat/conversations/${conversationId}/add-members`,
      userIds,
      { withCredentials: true }
    );
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
    dbg(`CHAT:notifyUnread conv=${convId} size=${this.unreadConversationIds.size}`);
  }

  clearUnreadForConversation(convId: number) {
    this.unreadConversationIds.delete(convId);
    console.log('✅ Lecture conversation', convId);
    this.unreadMessagesSubject.next(new Set(this.unreadConversationIds));
    dbg(`CHAT:clearUnread conv=${convId} size=${this.unreadConversationIds.size}`);
  }

  getUnreadConversations$(): Observable<Set<number>> {
    return this.unreadMessagesSubject.asObservable();
  }

  // chat.service.ts
  currentUserId!: number;

  setCurrentUserId(id: number) {
    this.currentUserId = id;
  }

 private localReadMap = new Map<number, number>(); // convId -> readMs

  // --- API lecture/écriture du cache --- //
  markAsReadLocally(convId: number, timestampIso: string) {
    const ms = this.toMillis(timestampIso);
    console.log(`[READ] mark local conv=${convId} tsIso=${timestampIso} ms=${ms}`);
    this.localReadMap.set(convId, ms);
    this.clearUnreadForConversation(convId);
    if (this.currentUserId) this.saveLocalReadMap(this.currentUserId);
  }

  wasReadLocally(convId: number, lastMessageIso: string): boolean {
    const readMs = this.localReadMap.get(convId);
    if (!readMs) return false;
    const lastMs = this.toMillis(lastMessageIso);
    // <= : déjà lu si j’ai un read >= au dernier message
    const result = lastMs <= readMs;
    // dbg facultatif :
    // dbg(`wasReadLocally conv=${convId} last=${lastMs} read=${readMs} => ${result}`);
    return result;
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
  // Date.parse gère l’ISO correctement (y compris .SSS et Z)
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
    if (this.currentUserId) localStorage.removeItem(this.storageKey(this.currentUserId));
    this.currentUserId = undefined as any;
    this.readiness$.next(false);
  }

  // 2) initForUser : on remplit le cache en ms (pas de normalizeIso ici)
  async initForUser(userId: number) {
    if (this.inFlightInit) return this.inFlightInit;
    const myToken = ++this.initToken;

    this.readiness$.next(false);
    this.unreadConversationIds.clear();
    this.unreadMessagesSubject.next(new Set());
    this.localReadMap.clear();
    this.setCurrentUserId(userId);

    this.inFlightInit = (async () => {
      try {
        // 1) serveur
        const serverMap = await firstValueFrom(this.getAllReadStatuses()); // { [convId]: iso }
        for (const [convId, tsIso] of Object.entries(serverMap)) {
          this.localReadMap.set(+convId, this.toMillis(tsIso));
        }
        // après avoir rempli localReadMap avec serverMap :
        console.log('[INIT] server read-status =>',
          Object.fromEntries(
            Object.entries(serverMap).map(([id, iso]) => [id, Date.parse(iso)])
          )
        );

        // juste après la fusion avec le localStorage :
        console.log('[INIT] localStorage read-status =>',
          Object.fromEntries(this.loadLocalReadMap(userId))
        );
        console.log('[INIT] merged readMap (ms) =>',
          Object.fromEntries(this.localReadMap)
        );

        // 2) local → fusion (on garde le plus récent)
        const local = this.loadLocalReadMap(userId);
        for (const [id, localMs] of local.entries()) {
          const serverMs = this.localReadMap.get(id) ?? 0;
          if (localMs > serverMs) this.localReadMap.set(id, localMs);
        }

        // 3) recalcul du badge
        if (myToken !== this.initToken) return;
        
        await this.refreshUnreadFromServerInternal('init');
      } finally {
        if (myToken === this.initToken) this.readiness$.next(true);
        this.inFlightInit = undefined;
        // (optionnel) persister la fusion
        this.saveLocalReadMap(userId);
      }
    })();

    return this.inFlightInit;
  }

  /** Recalcule le badge “non-lus” sans ouvrir la Messagerie */
  async refreshUnreadFromServer(): Promise<void> {
    await this.whenReady();
    return this.refreshUnreadFromServerInternal('manual');
  }

  // 3) refreshUnreadFromServerInternal : on ne normalise plus, on compare en ms
  private async refreshUnreadFromServerInternal(mark: number | string): Promise<void> {
    const convos = await firstValueFrom(this.getConversations());
    const nextSet = new Set<number>();

    for (const conv of convos) {
      const last = conv.lastMessage;
      if (!last) continue;

      const senderId = last.sender?.id ?? null;
      const alreadyRead = this.wasReadLocally(conv.id, last.timestamp);

      // 👇 sanity logs
      const lastMs = this.toMillis(last.timestamp);
      const readMs = this.localReadMap.get(conv.id) ?? 0;
      console.log(
        `COMPARE conv=${conv.id} sender=${senderId} me=${this.currentUserId} lastMs=${lastMs} readMs=${readMs} => alreadyRead=${alreadyRead}`
      );
      console.table(convos.map(c => ({
        id: c.id,
        type: c.type,
        lastSender: c.lastMessage?.sender?.id ?? null,
        lastTs: c.lastMessage?.timestamp ?? null
      })));

      if (senderId !== this.currentUserId && !alreadyRead) {
        nextSet.add(conv.id);
      }
    }

    this.unreadConversationIds = nextSet;
    this.unreadMessagesSubject.next(new Set(nextSet));
  }


  isReady(): boolean {
    return this.readiness$.value === true;
  }

  whenReady(): Promise<void> {
    if (this.isReady()) return Promise.resolve();
    // petite promesse qui se résout quand readiness$ passe à true
    return new Promise(res => {
      const sub = this.readiness$.subscribe(v => {
        if (v) { sub.unsubscribe(); res(); }
      });
    });
  }

  private loadLocalReadMap(userId: number): Map<number, number> {
    try {
      const raw = localStorage.getItem(this.storageKey(userId));
      if (!raw) return new Map();
      const obj = JSON.parse(raw) as Record<string, number>;
      return new Map(Object.entries(obj).map(([k,v]) => [Number(k), Number(v)]));
    } catch { return new Map(); }
  }

  private saveLocalReadMap(userId: number) {
    try {
      const obj: Record<number, number> = {};
      for (const [id, ms] of this.localReadMap.entries()) obj[id] = ms;
      localStorage.setItem(this.storageKey(userId), JSON.stringify(obj));
    } catch {}
  }

  private async baselineReadFromConversations(): Promise<void> {
    const convos = await firstValueFrom(this.getConversations());
    for (const conv of convos) {
      const last = conv.lastMessage;
      if (!last) continue;

      const convId = conv.id;
      const lastMs = this.toMillis(last.timestamp);
      const currentRead = this.localReadMap.get(convId) ?? 0;

      // Baseline uniquement si on n'a RIEN (ou très ancien) et si le dernier message
      // ne vient PAS de moi (sinon il est "lu" par définition).
      if ((currentRead === 0 || currentRead < lastMs) &&
          last.sender?.id !== this.currentUserId) {
        // ⚠️ à toi de choisir la politique : stricte (= seulement si 0) ou souple (= si < lastMs)
        // Pour éliminer les faux positifs au reboot, on prend la souple:
        this.localReadMap.set(convId, lastMs);
      }
    }
    if (this.currentUserId) this.saveLocalReadMap(this.currentUserId);
  }

}
