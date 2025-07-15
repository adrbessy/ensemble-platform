import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { HttpClient } from '@angular/common/http';

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
      `/api/events/${eventId}/participate`,
      {},
      { headers }
    );
  }

  withdrawParticipation(eventId: number) {
    return this.http.delete(`/api/events/${eventId}/participants`);
  }

}