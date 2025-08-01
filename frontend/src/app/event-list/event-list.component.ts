
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
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
  @ViewChild('measureSpan') measureSpan!: ElementRef;
  @ViewChild('cityInput') cityInput!: ElementRef;


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
  cityFilter: string = ''; // Valeur vide par défaut
  private _filterMode: '<5' | '<10' | '<20' | 'ville' = '<10'; // valeur par défaut
  isLoading: boolean = false;
  geoErrorMessage: string | null = null;
  isGeoLocating: boolean = false;
  citySuggestions: string[] = [];
  private previousFilters: any = {};


  searchCities(term: string): void {
    if (term.length < 1) {
      this.citySuggestions = [];
      return;
    }

    const url = `https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(term)}&fields=nom&boost=population&limit=10`;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        this.citySuggestions = data
          .map((c: any) => c.nom)
          .filter((nom: string) => nom.toLowerCase().startsWith(term.toLowerCase()));
      })
      .catch(err => {
        console.error("Erreur suggestions villes :", err);
        this.citySuggestions = [];
      });
  }


  selectCity(city: string): void {
    this.cityFilter = city;
    this.citySuggestions = [];
    this.adjustWidth(); 
    this.applyFilters();
  }

  clearCitySuggestions(): void {
    setTimeout(() => this.citySuggestions = [], 200);
  }
  
  refreshEventsWithLocation(): void {
    this.isLoading = true;

    const load = () => this.loadEvents();

    if (this.filterMode === '<5' || this.filterMode === '<10' || this.filterMode === '<20') {
      const cachedLat = localStorage.getItem('userLatitude');
      const cachedLng = localStorage.getItem('userLongitude');

      if (cachedLat && cachedLng) {
        this.userLatitude = parseFloat(cachedLat);
        this.userLongitude = parseFloat(cachedLng);
        load();
        return;
      }

      this.isGeoLocating = true;

      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.userLatitude = position.coords.latitude;
          this.userLongitude = position.coords.longitude;

          // Cache la position
          localStorage.setItem('userLatitude', this.userLatitude.toString());
          localStorage.setItem('userLongitude', this.userLongitude.toString());

          this.isGeoLocating = false;
          load();
        },
        (error) => {
          this.isGeoLocating = false;
          console.warn("❌ Géolocalisation échouée :", error);
          this.geoErrorMessage = "La position n’a pas pu être obtenue.";
          setTimeout(() => this.geoErrorMessage = null, 5000);
          load();
        },
        { timeout: 8000 }
      );
    } else {
      load();
    }
  }

onMyActivitiesToggle(): void {
  if (this.onlyMyEvents) {
    // 🔒 Sauvegarder les filtres avant de les désactiver
    this.previousFilters = {
      onlyWithFriends: this.onlyWithFriends,
      onlyPrivate: this.onlyPrivate,
      onlyParity: this.onlyParity,
      selectedTags: [...this.selectedTags],
      selectedGender: this.selectedGender,
      selectedVisibility: this.selectedVisibility,
      selectedDate: this.selectedDate,
      cityFilter: this.cityFilter,
      maxDistanceKm: this.maxDistanceKm,
      filterMode: this.filterMode
    };

    // ❌ Désactiver tous les autres filtres
    this.onlyWithFriends = false;
    this.onlyPrivate = false;
    this.onlyParity = false;
    this.selectedTags = [];
    this.selectedGender = '';
    this.selectedVisibility = '';
    this.selectedDate = null;
    this.cityFilter = '';
    this.maxDistanceKm = 10;
  } else {
    // 🔄 Restaurer les filtres précédents
    this.onlyWithFriends = this.previousFilters.onlyWithFriends || false;
    this.onlyPrivate = this.previousFilters.onlyPrivate || false;
    this.onlyParity = this.previousFilters.onlyParity || false;
    this.selectedTags = this.previousFilters.selectedTags || [];
    this.selectedGender = this.previousFilters.selectedGender || '';
    this.selectedVisibility = this.previousFilters.selectedVisibility || '';
    this.selectedDate = this.previousFilters.selectedDate || null;
    this.cityFilter = this.previousFilters.cityFilter || '';
    this.maxDistanceKm = this.previousFilters.maxDistanceKm || 10;
    this.filterMode = this.previousFilters.filterMode || '<10';
  }

  this.applyFilters();
}


  get filterMode(): '<5' | '<10' | '<20' | 'ville' {
    return this._filterMode;
  }

  set filterMode(value: '<5' | '<10' | '<20' | 'ville') {
    this._filterMode = value;
    this.onLieuFiltreChange();
  }


  selectedCities: string[] = []; // pour les localités tapées

  userContacts: any[] = []; // les amis


  tags: string[] = ['jeux de société', 'bar', 'randonnée', 'plage', 'musée', 'café', 'brunch', 'restaurant', 'concert', 'sport'];
  selectedTags: string[] = [];
  selectedDate: Date | null = null;

  onlyMyGroups = false;
  myGroupIds: number[] = [];
  groupedEvents: { date: string, events: any[] }[] = [];

  userLatitude: number | null = null;
  userLongitude: number | null = null;
  maxDistanceKm: number | null = 10; // ex: 5, 10 ou 20 km


  constructor(private http: HttpClient, private eventService: EventService, private authService: AuthService, private modalService: NgbModal,
  private notificationService: NotificationService, private groupService: GroupService) {
    this.currentUserId = this.authService.getCurrentUserId();
  }

  ngOnInit(): void {
    this.currentUserId = this.authService.getCurrentUserId();

    if (this.authService.isLoggedIn()) {
      const user = this.authService.getCurrentUser();
      this.userContacts = user.contacts || [];

      this.groupService.getMyGroups().subscribe({
        next: (groups) => this.myGroupIds = groups.map(g => g.id),
        error: (err) => console.error('Erreur chargement groupes :', err)
      });
    }

    // 🔁 Charge les événements même si l’utilisateur n’est pas connecté
    this.refreshEventsWithLocation();

    // 🔄 Toujours écouter le rafraîchissement
    this.eventService.refreshEvents$.subscribe(() => this.loadEvents());
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
    this.isLoading = true;

    this.eventService.getEvents().subscribe({
      next: (events) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const futureEvents = events
          .filter(e => e && e.id != null)
          .filter(e => new Date(e.date) >= today)
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        this.allEvents = futureEvents;
        this.events = [...this.allEvents];
        this.filteredEvents = [...this.events];

        this.applyFilters(); // premier filtrage sans géoloc
        this.isLoading = false;
      },
      error: error => {
        console.error('❌ Erreur chargement événements', error);
        this.isLoading = false;
      }
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
                  this.loadEvents(); // 🔁 Recharge depuis l’API après suppression
                  this.notificationService.success("Activité supprimée (aucun participant).");
                }, error => {
                  this.notificationService.error("Erreur lors de la suppression de l’activité.");
                });
              } else {
                this.notificationService.success("Désinscription réussie !");
                this.applyFilters(); // ✅ Mise à jour de l'affichage
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
    console.log('📦 Changement de distance détecté :', this.maxDistanceKm);
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

getDistanceToEvent(event: any): number | null {
  if (
    this.userLatitude != null &&
    this.userLongitude != null &&
    event.latitude != null &&
    event.longitude != null
  ) {
    return this.calculateDistanceKm(
      this.userLatitude,
      this.userLongitude,
      event.latitude,
      event.longitude
    );
  }
  return null;
}

  onCityFilterChange(): void {
    if (this.filterMode === 'ville') {
      this.searchCities(this.cityFilter);
      this.applyFilters();  // <= ici le filtre se mettra à jour aussi quand on efface
    }
  }


applyFilters(): void {

  console.log('👥 Nombre d’amis :', this.userContacts.length);
console.log('🔘 Filtre "amis présents" actif :', this.onlyWithFriends);

  if (this.onlyMyEvents) {
    this.filteredEvents = this.allEvents.filter(event =>
      event.participants?.some(p => p.id === this.currentUserId)
    );
    this.groupEventsByDate();
    return;
  }

  const currentUser = this.authService.getCurrentUser();
  const userGender = currentUser?.gender || null;

  this.filteredEvents = this.allEvents.filter(event => {
    // ⏰ Ne pas afficher les événements passés si non inscrit
    const now = new Date();
    const eventDate = new Date(event.date);
    const [h, m] = (event.endTime || event.startTime).split(':').map(Number);
    eventDate.setHours(h, m, 0, 0);
    const isMyEvent = event.participants?.some(p => p.id === this.currentUserId);
    if (eventDate < now && !isMyEvent) return false;

    // 📍 Filtre localisation
    const matchesLocation = (this.filterMode === 'ville')
      ? this.extractCity(event.location).toLowerCase() === this.cityFilter.trim().toLowerCase()
      : this.calculateDistanceKm(this.userLatitude!, this.userLongitude!, event.latitude, event.longitude) <= this.maxDistanceKm!;

    if (!matchesLocation) return false;

    // 🧑‍🤝‍🧑 Amis présents
    const isWithFriend = event.participants?.some(p =>
      this.userContacts.some(c => c.id === p.id)
    );

    // 👥 Si le filtre "amis" est coché seul
    if (this.onlyWithFriends && !this.onlyParity) {
      if (this.userContacts.length === 0) return false;
      if (!isWithFriend) return false;
    }


    // ♀️♂️ Parité
    const isParityEvent = event.genderRequirement === 'Parité';
    const isUserNotParticipant = !this.hasUserParticipated(event);
    const max = event.maxParticipants || 0;
    const maleCount = event.participants.filter((p: any) => p.gender === 'HOMME').length;
    const femaleCount = event.participants.filter((p: any) => p.gender === 'FEMME').length;
    const half = Math.floor(max / 2);

    let parityBlocked = false;
    if (isParityEvent && isUserNotParticipant && userGender !== 'AUTRE') {
      if (event.participants.length >= max) parityBlocked = true;
      else if (userGender === 'HOMME' && maleCount >= half) parityBlocked = true;
      else if (userGender === 'FEMME' && femaleCount >= half) parityBlocked = true;
    }

    const isParityOk = isParityEvent && !parityBlocked;

    // 🧠 Logique finale : Amis OU Parité
    if (this.onlyWithFriends && this.onlyParity) {
      return isWithFriend || isParityOk;
    } else if (this.onlyWithFriends) {
      return isWithFriend;
    } else if (this.onlyParity) {
      return isParityOk;
    }

    // Sinon, on montre tout ce qui est dans la zone
    return true;
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

  const visibleEvents = this.filteredEvents.filter(e => 
    e.participants.length < e.maxParticipants || this.hasUserParticipated(e)
  );

  visibleEvents.forEach(event => {
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
    // 🔴 NE PAS afficher les groupes sans événements
    .filter(group => group.events.length > 0)
    // 🟢 Trier par date croissante
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}



  toggleFiltersPanel() {
    this.showFilters = !this.showFilters;
  }

  isParityRespectedAfterJoin(event: any, gender: string): boolean {
    const maleCount = event.participants.filter((p: any) => p.gender === 'HOMME').length;
    const femaleCount = event.participants.filter((p: any) => p.gender === 'FEMME').length;

    if (gender === 'HOMME') {
      return maleCount + 1 <= femaleCount;
    }
    if (gender === 'FEMME') {
      return femaleCount + 1 <= maleCount;
    }

    // Genre AUTRE : on autorise toujours
    return true;
  }

  formatShortDate(dateStr: string): string {
    const date = new Date(dateStr);
    const jours = ['Dim.', 'Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.'];
    const mois = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

    const jour = jours[date.getDay()];
    const jourDuMois = date.getDate();
    const moisTxt = mois[date.getMonth()];

    return `${jour} ${jourDuMois} ${moisTxt}`;
  }

  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  onLieuFiltreChange(): void {
    // Reset les valeurs au changement
    if (this.filterMode === '<5') this.maxDistanceKm = 5;
    else if (this.filterMode === '<10') this.maxDistanceKm = 10;
    else if (this.filterMode === '<20') this.maxDistanceKm = 20;
    else if (this.filterMode === 'ville') this.maxDistanceKm = null;

    this.applyFilters();
  }

  inputWidth: number = 150;

updateInputWidth(): void {
  const base = 40;
  const text = this.cityFilter || '';
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  if (context) {
    context.font = '14px system-ui'; // ajuste selon ta police réelle
    const textWidth = context.measureText(text).width;
    this.inputWidth = Math.min(350, Math.max(60, textWidth + base));
  }

  // Appel de l'auto-complétion
  this.searchCities(this.cityFilter);
  console.log(this.inputWidth)
}

adjustWidth(): void {
  if (this.measureSpan?.nativeElement && this.cityInput?.nativeElement) {
    const span = this.measureSpan.nativeElement as HTMLElement;
    const input = this.cityInput.nativeElement as HTMLElement;
    const style = window.getComputedStyle(input);

    span.style.font = style.font;
    span.style.fontSize = style.fontSize;
    span.style.fontWeight = style.fontWeight;
    span.style.fontFamily = style.fontFamily;
    span.textContent = this.cityFilter || 'Tape une ville';

    const spanWidth = span.offsetWidth;
    this.inputWidth = Math.min(400, Math.max(50, spanWidth + 5)); // ou 16, à tester
  }
}

}
