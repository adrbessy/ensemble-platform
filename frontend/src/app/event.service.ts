import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

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
      `${environment.apiUrl}/api/events/${eventId}/participate`,
      {},
      { headers }
    );
  }

  withdrawParticipation(eventId: number) {
    return this.http.delete(`${environment.apiUrl}/api/events/${eventId}/participants`);
  }

}