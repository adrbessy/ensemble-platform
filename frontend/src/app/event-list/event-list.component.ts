
import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { EventService } from '../event.service';
import { AuthService } from '../auth.service';
import { Input } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmModalComponent } from '../confirm-modal/confirm-modal.component';
import { environment } from 'src/environments/environment';
import { NotificationService } from '../services/notification.service';
import { GroupService } from '../services/group.service';

@Component({
  selector: 'app-event-list',
  templateUrl: './event-list.component.html'
})
export class EventListComponent implements OnInit {
  allEvents: any[] = [];
  events: any[] = [];
  filteredEvents: any[] = [];
  currentUserId: number;
  onlyWithRemainingSpots = true;
  @Input() showFilters: boolean = false;

  tags: string[] = ['jeux de société', 'bar', 'randonnée', 'plage', 'musée', 'café', 'brunch', 'restaurant', 'concert', 'sport'];
  selectedTags: string[] = [];
  selectedDate: Date | null = null;

  onlyMyGroups = false;
  myGroupIds: number[] = [];

  constructor(private http: HttpClient, private eventService: EventService, private authService: AuthService, private modalService: NgbModal,
  private notificationService: NotificationService, private groupService: GroupService) {
    this.currentUserId = this.authService.getCurrentUserId();
  }

ngOnInit(): void {
  if (!this.authService.isLoggedIn()) {
    console.warn("Utilisateur non connecté → pas de chargement d'événements");
    return;
  }

  this.currentUserId = this.authService.getCurrentUserId();

  this.eventService.refreshEvents$.subscribe(() => {
    this.loadEvents(); // ✅ rafraîchissement uniquement sur demande
  });

  this.loadEvents(); // ✅ chargement initial

  this.groupService.getMyGroups().subscribe({
    next: (groups) => {
      this.myGroupIds = groups.map(g => g.id);
    },
    error: (err) => {
      console.error('Erreur chargement groupes :', err);
    }
  });
}

  loadEvents(): void {
    this.eventService.getEvents().subscribe(events => {
      this.allEvents = events;
      this.events = [...this.allEvents];
      this.allEvents.forEach(event => {
        console.log('Tags de l’événement :', event.title, event.tags);
      });
    });
  }

  hasUserParticipated(event: any): boolean {
    return event.participants?.some((user: any) => user.id === this.currentUserId);
  }

  participate(event: any): void {
    if (!this.authService.isLoggedIn()) {
      this.notificationService.warn("Veuillez vous connecter pour participer.");
      return;
    }

    this.eventService.participate(event.id).subscribe({
      next: () => {
        // Simulation locale si tu ne veux pas recharger
        event.participants = event.participants || [];
        event.participants.push({
        id: this.currentUserId,
        username: 'toi',
        });
        this.notificationService.success("Inscription réussie !");
      },
      error: err => {
        console.error("Erreur participation :", err);
        this.notificationService.error("Erreur lors de l'inscription.");
      }
    });
  }


  withdraw(event: any): void {
    const modalRef = this.modalService.open(ConfirmModalComponent);
    modalRef.componentInstance.title = "Désinscription";
    modalRef.componentInstance.message = "Souhaites-tu vraiment te désinscrire de cet événement ?";

    modalRef.result.then(
      (result) => {
        if (result === true) {
          this.eventService.withdrawParticipation(event.id).subscribe({
            next: () => {
              // Mise à jour locale après désinscription
              event.participants = event.participants.filter((user: any) => user.id !== this.currentUserId);
              this.notificationService.success("Désinscription réussie !");
            },
            error: err => {
              this.notificationService.error("Erreur lors de la désinscription.");
            }
          });
        }
      },
      () => {
        // Fermeture sans confirmation (fermé ou annulé)
      }
    );
  }

  applyFilters() {
    this.loadEvents(); // ou une version filtrée selon `onlyWithRemainingSpots`
    this.filteredEvents = this.events.filter(e => {
    const hasPlaces = !this.onlyWithRemainingSpots || (e.participants?.length || 0) < e.maxParticipants;
    const matchesTags = this.selectedTags.length === 0 || this.selectedTags.includes(e.tag);
    const matchesDate = !this.selectedDate || new Date(e.date) >= new Date(this.selectedDate);
    const matchesGroup = !this.onlyMyGroups || !e.group || this.myGroupIds.includes(e.group.id);

    return hasPlaces && matchesTags && matchesDate && matchesGroup;
  });
  }

  toggleFiltersPanel() {
    this.showFilters = !this.showFilters;
  }

}
