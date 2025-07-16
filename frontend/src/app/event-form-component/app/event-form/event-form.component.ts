import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { EventService } from 'src/app/event.service';
import { MessageService } from 'src/app/message.service';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { NotificationService } from 'src/app/services/notification.service';

@Component({
  selector: 'app-event-form',
  templateUrl: './event-form.component.html',
})
export class EventFormComponent {
  event = {
    title: '',
    description: '',
    location: '',
    date: ''
  };

  users: any[] = []; // <--- ici
  successMessage = false;

  constructor(private http: HttpClient, private eventService: EventService, private router: Router, private notificationService: NotificationService) {}

  ngOnInit() {
    this.http.get<any[]>(`${environment.apiUrl}/api/users`)
      .subscribe(data => {
        console.log('Utilisateurs récupérés :', data);
        this.users = data;
      });
  }

  submitForm() {
    this.http.post(`${environment.apiUrl}/api/events`, this.event)
      .subscribe({
        next: () => {
        // ✅ Affiche le message
        this.notificationService.success("Événement créé !");

        // ✅ Redirige vers la liste des événements
        this.router.navigate(['/events']);

          // 👉 Notifie les autres composants (comme event-list) de recharger
          this.eventService.notifyEventCreated();

          // Optionnel : réinitialiser le formulaire
          this.event = {
            title: '',
            description: '',
            location: '',
            date: ''
          };
        },
        error: err => {
          console.error(err);
          this.notificationService.error("Erreur de création.");
        }
      });
      this.successMessage = true;
      setTimeout(() => this.successMessage = false, 3000);
  }

  loading = false;

  onSubmit() {
    this.loading = true;
    // Ton code ici...
  }
}