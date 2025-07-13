import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { EventService } from 'src/app/event.service';
import { MessageService } from 'src/app/message.service';
import { Router } from '@angular/router';

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

  constructor(private http: HttpClient, private eventService: EventService, private router: Router, private messageService: MessageService) {}

  ngOnInit() {
    this.http.get<any[]>('http://localhost:8080/api/users')
      .subscribe(data => {
        console.log('Utilisateurs récupérés :', data);
        this.users = data;
      });
  }

  submitForm() {
    this.http.post('http://localhost:8080/api/events', this.event)
      .subscribe({
        next: () => {
        // ✅ Affiche le message
        this.messageService.showMessage('Événement créé avec succès !');

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
          alert('Erreur lors de la création de l\'événement');
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