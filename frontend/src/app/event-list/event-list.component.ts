
import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { EventService } from '../event.service';

@Component({
  selector: 'app-event-list',
  templateUrl: './event-list.component.html'
})
export class EventListComponent implements OnInit {
  events: any[] = [];
  currentUserId: number = 38; // à remplacer dynamiquement plus tard

  constructor(private http: HttpClient, private eventService: EventService) {}

  ngOnInit(): void {
    this.loadEvents();

    this.eventService.refreshEvents$.subscribe(() => {
      this.loadEvents();
    });
  }

  loadEvents() {
    this.http.get<any[]>('http://localhost:8080/api/events')
      .subscribe(data => this.events = data);
  }

  hasUserParticipated(event: any): boolean {
    return event.participants?.some((user: any) => user.id === this.currentUserId);
  }

  participate(event: any): void {
    this.eventService.participate(event.id)
      .subscribe({
        next: () => {
          event.participants = event.participants || [];
          event.participants.push({ id: this.currentUserId }); // Simule localement
        },
        error: err => {
          console.error('Erreur participation :', err);
        }
      });
  }
}
