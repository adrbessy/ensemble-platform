import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { EventService } from 'src/app/event.service';

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
    organizerId: null
  };

  users: any[] = []; // <--- ici
  successMessage = false;

  constructor(private http: HttpClient, private eventService: EventService) {}

  ngOnInit() {
    this.http.get<any[]>('http://localhost:8080/api/users')
      .subscribe(data => {
        console.log('Utilisateurs récupérés :', data);
        this.users = data;
      });
  }

  submitForm() {
    console.log("Valeur sélectionnée :", this.event.organizerId);
    if (this.event.organizerId == null) {
      alert('Veuillez sélectionner un organisateur');
      return;
    }
    this.http.post('http://localhost:8080/api/events', this.event)
      .subscribe({
        next: () => {
          alert('Événement créé avec succès !');

          // 👉 Notifie les autres composants (comme event-list) de recharger
          this.eventService.notifyEventCreated();

          // Optionnel : réinitialiser le formulaire
          this.event = {
            title: '',
            description: '',
            location: '',
            date: '',
            organizerId: null
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

  logSelection() {
    console.log('Sélectionné : ', this.event.organizerId);
  }

  loading = false;

  onSubmit() {
    this.loading = true;
    // Ton code ici...
  }
}