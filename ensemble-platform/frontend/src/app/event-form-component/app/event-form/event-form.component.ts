import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-event-form',
  templateUrl: './event-form.component.html',
})
export class EventFormComponent {
  event = {
    title: '',
    description: '',
    location: '',
    date: '',
    organizer: ''
  };

  constructor(private http: HttpClient) {}

  submitForm() {
    this.http.post('http://localhost:8080/api/events', this.event)
      .subscribe(() => {
        alert('Événement créé avec succès !');
        this.event = { title: '', description: '', location: '', date: '', organizer: '' };
      });
  }
}