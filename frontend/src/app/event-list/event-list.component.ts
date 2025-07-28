
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
  , styleUrls: ['./event-list.component.css']
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
  groupedEvents: { date: string, events: any[] }[] = [];

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
      console.log("Événements reçus depuis l’API :", events);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // 🔧 pour ignorer l'heure

      const futureEvents = events.filter(e => {
        const eventDate = new Date(e.date);
        return eventDate >= today;
      });

      futureEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      this.allEvents = futureEvents;
      this.events = [...this.allEvents];
      this.filteredEvents = [...this.events];

      this.groupEventsByDate();

      this.allEvents.forEach(event => {
        console.log(`Participants de l'événement "${event.title}":`, event.participants);
      });
    });
  }

  getPhotoUrl(filename: string): string {
    if (!filename) return 'assets/default-avatar.png';
    return `http://localhost:8080/uploads/images/${filename}`;
  }


  formatTimeRange(startTime: string, endTime: string): string {
    if (!startTime) return '';
    const [sh, sm] = startTime.split(':');
    const start = `${sh}h${sm !== '00' ? sm : ''}`;

    if (!endTime) return `à partir de ${start}`;
    const [eh, em] = endTime.split(':');
    const end = `${eh}h${em !== '00' ? em : ''}`;

    return `de ${start} à ${end}`;
  }

  formatHourRange(startTime: string, endTime?: string): string {
    if (!startTime) return '';
    const format = (time: string) => {
      const [h, m] = time.split(':');
      return `${h}:${m}`;
    };
    const start = format(startTime);
    const end = endTime ? format(endTime) : '';
    return end ? `${start} → ${end}` : `${start}`;
  }

  extractCity(address: string | undefined | null): string {
    console.log("Adresse reçue :", address);
    if (!address) return '';  // ⛔️ Si address est null ou vide, on renvoie une chaîne vide
    const parts = address.split(',');
    const lastPart = parts[parts.length - 2] || parts[parts.length - 1] || '';
    const cityMatch = lastPart.match(/\d{5}\s(.+)/);
    return cityMatch ? cityMatch[1].trim() : lastPart.trim();
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
        const user = this.authService.getCurrentUser();
        event.participants = event.participants || [];
        event.participants.push({
          id: user.id,
          username: user.username,
          photoFilename: user.photoFilename
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
    this.filteredEvents = this.events.filter(e => {
      const hasPlaces = !this.onlyWithRemainingSpots || (e.participants?.length || 0) < e.maxParticipants;
      const matchesTags = this.selectedTags.length === 0 || this.selectedTags.includes(e.tag);
      const matchesDate = !this.selectedDate || new Date(e.date) >= new Date(this.selectedDate);
      const matchesGroup = !this.onlyMyGroups || !e.group || this.myGroupIds.includes(e.group.id);
      return hasPlaces && matchesTags && matchesDate && matchesGroup;
    });

    this.groupEventsByDate(); // nouvelle méthode juste en dessous
  }

  groupEventsByDate() {
    const grouped = new Map<string, any[]>();

    this.filteredEvents.forEach(event => {
      const dateStr = new Date(event.date).toDateString();
      if (!grouped.has(dateStr)) {
        grouped.set(dateStr, []);
      }
      grouped.get(dateStr)!.push(event);
    });

    this.groupedEvents = Array.from(grouped.entries())
      .map(([date, events]) => ({
        date,
        events: events.sort((a, b) => {
          const aTime = a.startTime ? a.startTime.split(':').map(Number) : [0, 0];
          const bTime = b.startTime ? b.startTime.split(':').map(Number) : [0, 0];
          return aTime[0] - bTime[0] || aTime[1] - bTime[1];
        })
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }


  toggleFiltersPanel() {
    this.showFilters = !this.showFilters;
  }

}
