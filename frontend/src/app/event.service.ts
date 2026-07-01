import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from 'src/environments/environment';

export interface Event {
  id: number;
  title: string;
  description: string;
  date: string;                 // ISO yyyy-MM-dd
  location: string;             // adresse/ville affichée
  latitude: number;
  longitude: number;
  startTime: string;            // HH:mm
  endTime: string;              // HH:mm
  maxParticipants: number;
  minParticipants?: number;
  minAge?: number;
  maxAge?: number;
  tag?: string;
  participants: { id: number; gender?: string }[];
  organizer: { id: number };
  genderRequirement?: string;
  visibility: 'PUBLIC' | 'FRIENDS_ONLY' | 'GROUP' | 'CUSTOM';
  allowedUsers?: { id: number; username: string }[];
  imageUrl?: string;
}

@Injectable({ providedIn: 'root' })
export class EventService {
  private readonly base = environment.apiUrl; // ex: '/api' en prod (via Nginx), 'http://localhost:8080/api' en dev

  constructor(private http: HttpClient) {}

  private refreshEventsSubject = new Subject<void>();
  refreshEvents$ = this.refreshEventsSubject.asObservable();
  notifyEventCreated() { this.refreshEventsSubject.next(); }

  /** Participer à un événement (le backend déduit l’utilisateur via le JWT) */
  participate(eventId: number): Observable<void> {
    return this.http.post<void>(`${this.base}/events/${eventId}/participate`, {});
  }

  /** Se retirer (le backend lit l’user depuis le JWT) */
  withdrawParticipation(eventId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/events/${eventId}/participants`);
  }

  /** Liste (visible pour l’utilisateur courant) */
  getEvents(): Observable<Event[]> {
    return this.http.get<Event[]>(`${this.base}/events`);
  }

  /** Détails (gère PUBLIC + règles d’accès côté back ; ok même si la date est passée) */
  getEventById(id: number): Observable<Event> {
    return this.http.get<Event>(`${this.base}/events/${id}`);
  }

  /** Supprimer (si créateur et sans autre inscrit selon ta règle) */
  deleteEvent(eventId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/events/${eventId}`);
  }

  /** Recherche simple (âge min/max) – ajuste si tu ajoutes d’autres critères */
  searchEvents(minAge?: number, maxAge?: number): Observable<Event[]> {
    let params = new HttpParams();
    if (minAge != null) params = params.set('minAge', String(minAge));
    if (maxAge != null) params = params.set('maxAge', String(maxAge));
    return this.http.get<Event[]>(`${this.base}/events/search`, { params });
  }

  /** Ouvrir/créer la room de chat liée à l’événement (si tu as cet endpoint) */
  openEventChat(eventId: number): Observable<{ conversationId: number }> {
    return this.http.post<{ conversationId: number }>(
      `${this.base}/chat/events/${eventId}/room`, {}
    );
  }
}
