import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { EventService } from 'src/app/event.service';
import { MessageService } from 'src/app/message.service';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { NotificationService } from 'src/app/services/notification.service';
import { GroupService } from 'src/app/services/group.service';
import { NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import { AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { AuthService } from 'src/app/auth.service';
declare var google: any;

interface EventForm {
  title: string;
  description: string;
  date: NgbDateStruct | null;
  startTime: string; // 🆕
  endTime: string; 
  time?: string;
  location: string;
  placeName: string; // 🆕 pour le nom du lieu
  address: string; // 🆕 pour l'adresse
  tag: string; // un seul tag
  maxParticipants?: number; // ✅
  minParticipants: number;
  genderRequirement?: string; // peut être "Parité", "Mixte", "Homme", "Femme"
  visibility?: string; // peut être "PUBLIC", "GROUP"
  groupId?: string | null; // ID du groupe si visibilité est "GROUP",
  minAge?: number;
  maxAge?: number;
}

@Component({
  selector: 'app-event-form',
  templateUrl: './event-form.component.html',
})
export class EventFormComponent {

  @ViewChild('searchInput', { static: false }) searchInput!: ElementRef;

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (!this.searchInput) return;

      const autocomplete = new google.maps.places.Autocomplete(this.searchInput.nativeElement, {
        types: ['establishment'],
        componentRestrictions: { country: 'fr' }
      });

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        this.event.placeName = place.name;
        this.event.address = place.formatted_address;

        // ✅ Effacer l'erreur dès qu’un lieu est sélectionné
        this.locationError = false;
      });
    }, 0);
  }

  event: EventForm = {
    title: '',
    description: '',
    date: null,
    startTime: '',
    endTime: '',
    location: '',
    placeName: '', // 🆕 pour le nom du lieu
    address: '', // 🆕 pour l'adresse
    tag: '', // valeur vide par défaut
    minParticipants: 4,
    maxParticipants: 8, // ✅ valeur par défaut
    genderRequirement: 'Parité', // ✅ valeur par défaut
    visibility: 'PUBLIC', // 👈 ajout
    groupId: null,          // 👈 ajout,
    minAge: undefined,     // 👈 ajout
    maxAge: undefined,     // 👈 ajout
  };

  users: any[] = []; // <--- ici
  successMessage = false;
  allTags: string[] = [
    'jeux de société', 'bar', 'randonnée', 'plage', 'musée', 'café', 'brunch', 'restaurant', 'concert', 'sport',
    'atelier de langues', 'bowling', 'escape game', 'cinéma', 'karaoké', 'pique-nique'
  ];
  tagCounts: { [tag: string]: number } = {
    'jeux de société': 5,
    'bar': 3,
    'randonnée': 6,
    'plage': 4,
    'musée': 1,
    'café': 2,
    'brunch': 2,
    'restaurant': 1,
    'concert': 3,
    'sport': 8,
    'atelier de langues': 2,
    'bowling': 2,
    'escape game': 1,
    'cinéma': 1,
    'karaoké': 1,
    'pique-nique': 2
  };
  filteredTags: string[] = [];
  searchTag = '';

  myGroups: any[] = [];

  minDate: NgbDateStruct;

  descriptionError: boolean = false;
  maxDescriptionLength = 500;
  participantRangeError: boolean = false;
  dateInPastError: boolean = false;
  timeRangeError: boolean = false;
  dateOrTimeMissingError: boolean = false;
  tagMissingError: boolean = false;
  ageRangeError: boolean = false;
  locationError: boolean = false;
  maxParticipantsError: boolean = false;
  minParticipantsError: boolean = false;

  currentUser: any;

  constructor(private http: HttpClient, private eventService: EventService, private router: Router, private notificationService: NotificationService,
  private groupService: GroupService, private authService: AuthService) {
    const today = new Date();
    this.minDate = {
      year: today.getFullYear(),
      month: today.getMonth() + 1,
      day: today.getDate()
    };
  }

  ngOnInit() {
    this.http.get<any[]>(`${environment.apiUrl}/users`)
      .subscribe(data => {
        console.log('Utilisateurs récupérés :', data);
        this.users = data;
      });

    this.groupService.getMyGroups().subscribe({
      next: (groups) => this.myGroups = groups,
      error: (err) => console.error('Erreur chargement groupes', err)
    });

    this.filteredTags = this.getTopTags(10);

    this.currentUser = this.authService.getDecodedToken();
    console.log('Token décodé :', this.currentUser);
    if (this.currentUser?.birthDate) {
      this.setDefaultAgeRange();
    }
  }

  getTopTags(limit: number): string[] {
    return this.allTags.sort((a, b) => (this.tagCounts[b] || 0) - (this.tagCounts[a] || 0)).slice(0, limit);
  }

  onSearchTagChange() {
    const query = this.searchTag.trim().toLowerCase();
    if (!query) {
      this.filteredTags = this.getTopTags(10);
    } else {
      this.filteredTags = this.allTags.filter(tag => tag.toLowerCase().includes(query));
    }
  }

  onDescriptionChange(): void {
    if (this.event.description && this.event.description.trim().length >= 10 && this.event.description.trim().length <= this.maxDescriptionLength) {
      this.descriptionError = false;
    }
  }

  onDateOrTimeChange(): void {
    if (this.event.date && this.event.startTime) {
      this.dateOrTimeMissingError = false;

      const [year, month, day] = [
        this.event.date.year,
        this.event.date.month - 1,
        this.event.date.day,
      ];
      const [hours, minutes] = this.event.startTime.split(':').map(Number);

      const eventDateTime = new Date(year, month, day, hours, minutes);
      const now = new Date();

      if (eventDateTime > now) {
        this.dateInPastError = false;
      }
    }
  }

isToday(): boolean {
  const today = new Date();
  const selected = this.event.date;

  if (!selected) return false;

  return (
    selected.year === today.getFullYear() &&
    selected.month === today.getMonth() + 1 &&
    selected.day === today.getDate()
  );
}

getMinStartTime(): string | null {
  if (!this.event.date) return null;
  const today = new Date();
  const selected = new Date(
    this.event.date.year,
    this.event.date.month - 1,
    this.event.date.day
  );
  const isToday = selected.toDateString() === today.toDateString();
  if (isToday) {
    const hours = today.getHours().toString().padStart(2, '0');
    const minutes = today.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }
  return null;
}

getDateFromString(date: string | Date): Date | null {
  console.log(typeof this.event.date, this.event.date);
  if (!date) return null;
  if (date instanceof Date) return date;
  const [day, month, year] = date.split('/').map(Number);
  if (!day || !month || !year) return null;
  return new Date(year, month - 1, day);
}

  submitForm() {
    this.tagMissingError = false;
    if (!this.event.tag || this.event.tag.trim() === '') {
      this.tagMissingError = true;
      return;
    }

    this.descriptionError = false;
    if (
      !this.event.description ||
      this.event.description.trim().length < 10 ||
      this.event.description.trim().length > this.maxDescriptionLength
    ) {
      this.descriptionError = true;
      return;
    }

    this.participantRangeError = false;
    const min = this.event.minParticipants;
    const max = this.event.maxParticipants;
    if (min != null && max != null && max < min) {
      this.participantRangeError = true;
      return;
    }

    this.dateOrTimeMissingError = false;
    if (!this.event.date || !this.event.startTime) {
      this.dateOrTimeMissingError = true;
      return;
    }

    if (this.event.date && this.event.startTime) {
      const [year, month, day] = [
        this.event.date.year,
        this.event.date.month - 1, // JavaScript Date: 0 = janvier
        this.event.date.day
      ];
      const [hours, minutes] = this.event.startTime.split(':').map(Number);
      const eventDateTime = new Date(year, month, day, hours, minutes);
      const now = new Date();
      if (eventDateTime < now) {
        this.dateInPastError = true;
        return;
      }
    }

    this.timeRangeError = false;
    if (this.event.startTime && this.event.endTime) {
      const [startHours, startMinutes] = this.event.startTime.split(':').map(Number);
      const [endHours, endMinutes] = this.event.endTime.split(':').map(Number);
      const start = new Date(0, 0, 0, startHours, startMinutes);
      const end = new Date(0, 0, 0, endHours, endMinutes);
      if (end <= start) {
        this.timeRangeError = true;
        return;
      }
    }

    this.locationError = false;
    if (!this.event.placeName || !this.event.address) {
      this.locationError = true;
      return;
    }

    this.minParticipantsError = false;
    if (
      this.event.minParticipants != null &&
      (this.event.minParticipants < 2 || this.event.minParticipants > 100)
    ) {
      this.minParticipantsError = true;
      return;
    }

    this.maxParticipantsError = false;
    if (
      this.event.maxParticipants == null ||
      this.event.maxParticipants < 2 ||
      this.event.maxParticipants > 100
    ) {
      this.maxParticipantsError = true;
      return;
    }

    if (
      this.event.minAge != null &&
      this.event.maxAge != null &&
      this.event.maxAge < this.event.minAge
    ) {
      this.ageRangeError = true;
      return;
    }

    this.loading = true;
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
            placeName: '', // Réinitialise le nom du lieu
            address: '', // Réinitialise l'adresse
            date: null,
            tag: '',
            minParticipants: 4,
            maxParticipants: 6,
            genderRequirement: 'Parité',
            visibility: 'PUBLIC',
            groupId: null, // Réinitialise le groupe sélectionné
            startTime: '',
            endTime: '' // Réinitialise les heures de début et de fin
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

  selectTag(tag: string): void {
    this.event.tag = tag;
    this.tagMissingError = false;
  }

  setDefaultAgeRange(): void {
    const birthDate = new Date(this.currentUser.birthDate); // YYYY-MM-DD
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();

    const hasHadBirthdayThisYear =
      today.getMonth() > birthDate.getMonth() ||
      (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate());

    if (!hasHadBirthdayThisYear) {
      age -= 1;
    }

    const minAge = Math.max(13, age - 10);
    const maxAge = Math.min(100, age + 10);

    this.event.minAge = minAge;
    this.event.maxAge = maxAge;
  }

}