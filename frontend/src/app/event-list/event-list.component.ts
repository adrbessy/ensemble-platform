
import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { EventService } from '../event.service';

@Component({
  selector: 'app-event-list',
  templateUrl: './event-list.component.html'
})
export class EventListComponent implements OnInit {
  events: any[] = [];

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
}
