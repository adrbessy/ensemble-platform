
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
  selectedVisibility: string = '';
  selectedGender: string = '';
  onlyMyEvents: boolean = false;
  onlyWithFriends: boolean = false;
  onlyPrivate: boolean = false;
  onlyParity: boolean = false;
  villeRecherchee: string = '';
  selectedCity: string = '';

  userContacts: any[] = []; // les amis


  tags: string[] = ['jeux de société', 'bar', 'randonnée', 'plage', 'musée', 'café', 'brunch', 'restaurant', 'concert', 'sport'];
  selectedTags: string[] = [];
  selectedDate: Date | null = null;

  onlyMyGroups = false;
  myGroupIds: number[] = [];
  groupedEvents: { date: string, events: any[] }[] = [];

  userLatitude: number | null = null;
  userLongitude: number | null = null;
  maxDistanceKm: number | null = null; // ex: 5, 10 ou 20 km


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

  /*this.loadEvents().then(() => {
    console.log("✅ Événements chargés et géocodés");
  });*/
  this.loadEvents();

  this.groupService.getMyGroups().subscribe({
    next: (groups) => {
      this.myGroupIds = groups.map(g => g.id);
    },
    error: (err) => {
      console.error('Erreur chargement groupes :', err);
    }
  });

  const user = this.authService.getCurrentUser();
  this.userContacts = user.contacts || [];


  navigator.geolocation.getCurrentPosition(
    (position) => {
      this.userLatitude = position.coords.latitude;
      this.userLongitude = position.coords.longitude;
      console.log("📍 Localisation utilisateur :", this.userLatitude, this.userLongitude);
      this.applyFilters(); // Recalcule avec les filtres
    },
    (error) => {
      console.warn("Géolocalisation refusée ou indisponible");
    }
  );

}

getCityFromCoordinates(lat: number, lon: number): void {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;

  fetch(url)
    .then(res => res.json())
    .then(data => {
      const city = data.address.city || data.address.town || data.address.village || data.address.county;
      console.log("📍 Ville détectée :", city);
      this.selectedCity = city; // Tu l'utilises ensuite pour pré-remplir le champ de filtre
      this.applyFilters();
    })
    .catch(err => {
      console.error("Erreur reverse geocoding :", err);
    });
}


clearFilter(filter: string): void {
  switch (filter) {
    case 'visibility':
      this.selectedVisibility = '';
      break;
    case 'gender':
      this.selectedGender = '';
      break;
    case 'date':
      this.selectedDate = null;
      break;
    case 'myEvents':
      this.onlyMyEvents = false;
      break;
  }
  this.applyFilters();
}

  removeTag(tag: string): void {
    this.selectedTags = this.selectedTags.filter(t => t !== tag);
    this.applyFilters();
  }

  async loadEvents(): Promise<void> {
    this.eventService.getEvents().subscribe(async events => {
      console.log("Événements reçus depuis l’API :", events);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const futureEvents = events.filter(e => {
        const eventDate = new Date(e.date);
        return eventDate >= today;
      });

      // 🔄 Géocodage si latitude/longitude manquantes
      /*const geocodePromises = futureEvents.map(async (event) => {
        if (!event.latitude || !event.longitude) {
          const coords = await this.getCoordinatesFromAddress(event.location);
          if (coords) {
            event.latitude = coords.lat;
            event.longitude = coords.lon;
            // on peut aussi reconstruire une string "(lat, lng)" si nécessaire :
            event.location = `(${coords.lat}, ${coords.lon})`;
          } else {
            console.warn(`❌ Impossible de géocoder : ${event.location}`);
          }
        }
      });

      await Promise.all(geocodePromises);*/

      futureEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      this.allEvents = futureEvents;
      this.events = [...this.allEvents];
      this.filteredEvents = [...this.events];

      this.groupEventsByDate();
      this.applyFilters();

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
        console.log("Utilisateur connecté :", user);
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
              // Retirer l'utilisateur localement
              event.participants = event.participants.filter((user: any) => user.id !== this.currentUserId);

              if (event.participants.length === 0) {
                // Supprimer l'événement côté serveur
                this.eventService.deleteEvent(event.id).subscribe(() => {
                  this.removeEventFromUI(event.id);
                  this.notificationService.success("Activité supprimée (aucun participant).");
                }, error => {
                  this.notificationService.error("Erreur lors de la suppression de l’activité.");
                });
              } else {
                this.notificationService.success("Désinscription réussie !");
              }
            },
            error: err => {
              this.notificationService.error("Erreur lors de la désinscription.");
            }
          });
        }
      },
      () => {
        // Fermeture du modal sans action
      }
    );
  }

  removeEventFromUI(eventId: number): void {
    for (let group of this.groupedEvents) {
      group.events = group.events.filter(e => e.id !== eventId);
    }
    this.groupedEvents = this.groupedEvents.filter(group => group.events.length > 0);
  }

  onDistanceChanged(event: any): void {
  console.log('📦 Changement de distance détecté :', this.maxDistanceKm, ' | brut:', event?.target?.value);
  this.applyFilters();
}


  isWithinDistance(event: any, maxKm: number): boolean {
  if (!this.userLatitude || !this.userLongitude || !event.latitude || !event.longitude) {
    return true; // si on ne peut pas comparer, on ne filtre pas
  }

  const R = 6371;
  const dLat = this.toRad(event.latitude - this.userLatitude);
  const dLng = this.toRad(event.longitude - this.userLongitude);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(this.toRad(this.userLatitude)) *
    Math.cos(this.toRad(event.latitude)) *
    Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;

  return d <= maxKm;
}


toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = this.toRad(lat2 - lat1);
  const dLon = this.toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
            Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}


applyFilters(): void {

  const noOtherFiltersActive =
    !this.onlyMyEvents &&
    !this.onlyWithFriends &&
    !this.onlyPrivate &&
    !this.onlyParity &&
    this.selectedTags.length === 0 &&
    !this.selectedGender &&
    !this.selectedVisibility &&
    !this.selectedDate;

  const noFilterActive =
    !this.onlyMyEvents &&
    !this.onlyWithFriends &&
    !this.onlyPrivate &&
    !this.onlyParity &&
    this.selectedTags.length === 0 &&
    !this.selectedGender &&
    !this.selectedVisibility &&
    !this.selectedDate &&
    !this.maxDistanceKm &&
    !this.villeRecherchee;

  if (noFilterActive) {
    this.filteredEvents = [...this.allEvents];
    this.groupEventsByDate();
    return;
  }

  this.filteredEvents = this.allEvents.filter(event => {
    // 🔍 Log de l'événement traité
    //console.log(`📦 Event: "${event.title}", location: "${event.location}"`);

    const isMyEvent = event.participants?.some(p => p.id === this.currentUserId);
    const isWithFriend = event.participants?.some(p =>
      this.userContacts.some(c => c.id === p.id)
    );
    const isPrivate = event.visibility && event.visibility !== 'PUBLIC';
    const isParity = event.genderRequirement === 'Parité';
    const hasMatchingTag = this.selectedTags.length > 0 && this.selectedTags.includes(event.tag);
    const matchesGender = this.selectedGender && event.genderRequirement === this.selectedGender;
    const matchesVisibility = this.selectedVisibility && event.visibility === this.selectedVisibility;
    const matchesDate = this.selectedDate && new Date(event.date) >= new Date(this.selectedDate);
    const matchesCity = !this.selectedCity || (event.location && event.location.toLowerCase().includes(this.selectedCity.toLowerCase()));
    const matchesDistance = !this.maxDistanceKm || (
      event.latitude != null &&
      event.longitude != null &&
      this.userLatitude != null &&
      this.userLongitude != null &&
      this.calculateDistanceKm(this.userLatitude, this.userLongitude, event.latitude, event.longitude) <= this.maxDistanceKm
    );


    //const matchesDistance = !this.maxDistanceKm || this.isWithinDistance(event, this.maxDistanceKm);
    //console.log('Distance filtre activé ? ', this.maxDistanceKm, 'Résultat =', matchesDistance, 'Event:', event.title);
  return (
    (
      (this.onlyMyEvents && isMyEvent) ||
      (this.onlyWithFriends && isWithFriend) ||
      (this.onlyPrivate && isPrivate) ||
      (this.onlyParity && isParity) ||
      hasMatchingTag ||
      matchesGender ||
      matchesVisibility ||
      matchesDate ||
      noOtherFiltersActive  // ✅ autorise uniquement la distance
    ) && matchesDistance
  );
    });
    this.groupEventsByDate();
  }


getCoordinatesFromAddress(address: string): Promise<{ lat: number, lon: number } | null> {
  const encoded = encodeURIComponent(address);
  const url = `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1`;
  return fetch(url)
    .then(res => res.json())
    .then(results => {
      if (results.length > 0) {
        return {
          lat: parseFloat(results[0].lat),
          lon: parseFloat(results[0].lon)
        };
      }
      return null;
    })
    .catch(err => {
      console.error('Erreur géocodage :', err);
      return null;
    });
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
