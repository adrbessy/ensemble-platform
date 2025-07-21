import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { EventService } from 'src/app/event.service';
import { MessageService } from 'src/app/message.service';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { NotificationService } from 'src/app/services/notification.service';
import { GroupService } from 'src/app/services/group.service';

interface EventForm {
  title: string;
  description: string;
  date: string;
  time?: string;
  location: string;
  tag: string; // un seul tag
  maxParticipants?: number; // ✅
  genderRequirement?: string; // peut être "Parité", "Mixte", "Homme", "Femme"
  visibility?: string; // peut être "PUBLIC", "GROUP"
  groupId?: string | null; // ID du groupe si visibilité est "GROUP"
}

@Component({
  selector: 'app-event-form',
  templateUrl: './event-form.component.html',
})
export class EventFormComponent {

  event: EventForm = {
    title: '',
    description: '',
    date: '',
    location: '',
    tag: '', // valeur vide par défaut
    maxParticipants: 6, // ✅ valeur par défaut
    genderRequirement: 'Parité', // ✅ valeur par défaut
    visibility: 'PUBLIC', // 👈 ajout
    groupId: null          // 👈 ajout
  };

  users: any[] = []; // <--- ici
  successMessage = false;

  availableTags: string[] = [
    'jeux de société', 'bar', 'randonnée', 'plage',
    'musée', 'café', 'brunch', 'restaurant', 'concert', 'sport', 'atelier de langues', 'bowling', 'escape game', 'cinéma', 'karaoké', 'pique-nique'
  ];

  myGroups: any[] = [];

  constructor(private http: HttpClient, private eventService: EventService, private router: Router, private notificationService: NotificationService,
  private groupService: GroupService) {}

  ngOnInit() {
    this.http.get<any[]>(`${environment.apiUrl}/api/users`)
      .subscribe(data => {
        console.log('Utilisateurs récupérés :', data);
        this.users = data;
      });

      this.groupService.getMyGroups().subscribe({
        next: (groups) => this.myGroups = groups,
        error: (err) => console.error('Erreur chargement groupes', err)
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
            date: '',
            tag: '' // valeur vide par défaut
          };
        },
        error: err => {
          console.error(err);
          this.notificationService.error("Erreur de création.");
        }
      });
      this.successMessage = true;
      setTimeout(() => this.successMessage = false, 3000);
      const payload = {
        ...this.event,
        // groupId inclus déjà si visibilité === GROUP
      };
  }

  loading = false;

  onSubmit() {
    this.loading = true;
    // Ton code ici...
  }

  selectTag(tag: string) {
    this.event.tag = tag;
  }
}