import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

export interface Event {
  id: number;
  title: string;
  description: string;
  date: string;
  location: string;
  latitude: number;
  longitude: number;
  startTime: string;
  endTime: string;
  maxParticipants: number;
  participants: { id: number; gender?: string }[];
  organizer: { id: number };
  genderRequirement?: string;
  visibility: 'PUBLIC' | 'FRIENDS_ONLY' | 'GROUP' | 'CUSTOM';
  allowedUsers?: { id: number; username: string }[];
}


@Injectable({
  providedIn: 'root'
})
export class EventService {
  constructor(private http: HttpClient) {}

  private refreshEventsSubject = new Subject<void>();
  refreshEvents$ = this.refreshEventsSubject.asObservable();

  notifyEventCreated() {
    this.refreshEventsSubject.next();
  }

  participate(eventId: number) {
    const token = localStorage.getItem('token'); // ou sessionStorage
    console.log('Token utilisé :', token);
    const headers = {
      Authorization: `Bearer ${token}`
    };
    return this.http.post(
      `${environment.apiUrl}/events/${eventId}/participate`,
      {},
      { headers }
    );
  }

  withdrawParticipation(eventId: number) {
    return this.http.delete(`${environment.apiUrl}/events/${eventId}/participants`);
  }

  getEvents(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/events`);
  }

  deleteEvent(eventId: number) {
    return this.http.delete(`${environment.apiUrl}/events/${eventId}`);
  }

  getEventById(id: number) {
    return this.http.get(`${environment.apiUrl}/events/${id}`);
  }

  searchEvents(minAge?: number, maxAge?: number): Observable<Event[]> {
    const params: any = {};
    if (minAge !== undefined) params.minAge = minAge;
    if (maxAge !== undefined) params.maxAge = maxAge;

    const token = localStorage.getItem('token');
    const headers: any = token ? { Authorization: `Bearer ${token}` } : {};

    return this.http.get<Event[]>('/api/events/search', { params, headers });
  }

  openEventChat(eventId: number) {
    const token = localStorage.getItem('token');
    const headers: any = token ? { Authorization: `Bearer ${token}` } : {};

    return this.http.post<any>(`${environment.apiUrl}/chat/events/${eventId}/room`, {}, { headers });
  }


}