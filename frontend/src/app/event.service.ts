import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EventService {
  private refreshEventsSubject = new Subject<void>();
  refreshEvents$ = this.refreshEventsSubject.asObservable();

  notifyEventCreated() {
    this.refreshEventsSubject.next();
  }
}