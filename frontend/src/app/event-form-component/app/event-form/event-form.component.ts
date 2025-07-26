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
import { ContactService } from 'src/app/services/contact.service';
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
  invitedUserIds?: number[]; // pour "CUSTOM" visibility
  minAge?: number;
  maxAge?: number;
}

@Component({
  selector: 'app-event-form',
  templateUrl: './event-form.component.html',
  styleUrls: ['./event-form.component.css']
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
        this.event.location = place.formatted_address;
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
    invitedUserIds: [],     // 👈 ajout
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
  myContacts: any[] = [];

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
  userAgeOutOfRangeError: boolean = false;
  minAgeError: boolean = false;
  groupSelectionError: boolean = false;
  invitedContactsError: boolean = false;

  currentUser: any;

  genderOptions: { value: string; label: string }[] = [];

  currentStep = 1;

  constructor(private http: HttpClient, private eventService: EventService, private router: Router, private notificationService: NotificationService,
  private groupService: GroupService, private authService: AuthService, private contactService: ContactService) {
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

    const userGender = this.currentUser?.gender; // ex : "Homme", "Femme", "Autre"
    console.log('Genre de l’utilisateur :', userGender);
    this.initGenderOptions(userGender);

    this.contactService.getMyContacts().subscribe(contacts => {
      this.myContacts = contacts;
    });
  }

  initGenderOptions(userGender: string): void {
    const allOptions = [
      { value: 'Parité', label: '♀️ = ♂️ Parité' },
      { value: 'Mixte', label: '♀️♂️ Mixte' },
      { value: 'Femme', label: '♀️ Femmes uniquement' },
      { value: 'Homme', label: '♂️ Hommes uniquement' },
    ];

    this.genderOptions = allOptions.filter(option => {
      if (userGender === 'HOMME' && option.value === 'Femme') return false;
      if (userGender === 'FEMME' && option.value === 'Homme') return false;
      return true;
    });
  }

  nextStep(): void {
    this.descriptionError = false;
    this.tagMissingError = false;
    this.dateOrTimeMissingError = false;
    this.dateInPastError = false;
    this.timeRangeError = false;
    this.locationError = false;

    // Tag obligatoire
    if (!this.event.tag || this.event.tag.trim() === '') {
      this.tagMissingError = true;
    }

    // Description obligatoire
    const desc = this.event.description?.trim() || '';
    if (desc.length < 10 || desc.length > this.maxDescriptionLength) {
      this.descriptionError = true;
    }

    // Date + Heure début
    if (!this.event.date || !this.event.startTime) {
      this.dateOrTimeMissingError = true;
    }

    // Date dans le futur
    if (this.event.date && this.event.startTime && !this.dateOrTimeMissingError) {
      const [y, m, d] = [this.event.date.year, this.event.date.month - 1, this.event.date.day];
      const [h, min] = this.event.startTime.split(':').map(Number);
      const eventDate = new Date(y, m, d, h, min);
      if (eventDate < new Date()) this.dateInPastError = true;
    }

    // Heure de fin > début (si endTime renseignée)
    if (this.event.startTime && this.event.endTime) {
      const [sh, sm] = this.event.startTime.split(':').map(Number);
      const [eh, em] = this.event.endTime.split(':').map(Number);
      const start = new Date(0, 0, 0, sh, sm);
      const end = new Date(0, 0, 0, eh, em);
      if (end <= start) this.timeRangeError = true;
    }

    // Lieu obligatoire
    if (!this.event.placeName || !this.event.address) {
      this.locationError = true;
    }

    // Si aucune erreur : passer à l'étape 2
    if (!this.descriptionError && !this.tagMissingError && !this.dateOrTimeMissingError && !this.dateInPastError && !this.timeRangeError && !this.locationError) {
      this.currentStep = 2;
    }
  }

  previousStep() {
    this.currentStep = 1;
  }

  showEmojiList = false;
  emojis: string[] = [
    '😊', '😍', '🎉', '🔥', '❤️', '👍', '🙌', '🥳', '💬', '😎',
    '🌟', '🍕', '📅', '🎶', '☀️', '🏞️', '🎭', '👥'
  ];
  toggleEmojiPanel() {
    this.showEmojiList = !this.showEmojiList;
  }
  addEmoji(emoji: string) {
    this.event.description = (this.event.description || '') + emoji;
    this.showEmojiList = false; // facultatif : referme après clic
  }

  selectedFile: File | null = null;
  previewUrl: string | null = null;

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    this.selectedFile = file;

    const reader = new FileReader();
    reader.onload = () => {
      this.previewUrl = reader.result as string;
    };
    reader.readAsDataURL(file);
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

  onParticipantsMinChange(): void {
    if (this.event.minParticipants != null && this.event.minParticipants >= 2 && this.event.minParticipants <= 100) {
      this.minParticipantsError = false;
    }
    const min = this.event.minParticipants;
    const max = this.event.maxParticipants;
    if (min != null && max != null && max >= min) {
      this.participantRangeError = false;
    } 
  }

  onParticipantsMaxChange(): void {
    if (this.event.maxParticipants != null && this.event.maxParticipants >= 2 && this.event.maxParticipants <= 100) {
      this.maxParticipantsError = false;
    }
    const min = this.event.minParticipants;
    const max = this.event.maxParticipants;
    if (min != null && max != null && max >= min) {
      this.participantRangeError = false;
    }
  }

  onAgeMinChange(): void {
    if (this.event.minAge != null && this.event.minAge >= 16) {
      this.minAgeError = false;
    }
    if (this.event.minAge != null && this.event.maxAge != null && this.event.maxAge >= this.event.minAge) {
      this.ageRangeError = false;
    }
    const userAge = this.getUserAge();
    if (
      (this.event.minAge != null && userAge >= this.event.minAge) &&
      (this.event.maxAge != null && userAge <= this.event.maxAge)
    ) {
      this.userAgeOutOfRangeError = false;
    }
  }

  onAgeMaxChange(): void {
    if (this.event.maxAge != null && this.event.maxAge >= 16) {
      this.maxParticipantsError = false;
    }
    if (this.event.minAge != null && this.event.maxAge != null && this.event.maxAge >= this.event.minAge) {
      this.ageRangeError = false;
    }
        const userAge = this.getUserAge();
    if (
      (this.event.minAge != null && userAge >= this.event.minAge) &&
      (this.event.maxAge != null && userAge <= this.event.maxAge)
    ) {
      this.userAgeOutOfRangeError = false;
    }
  }

  onVisibilityChange(): void {
    this.groupSelectionError = false;
    this.invitedContactsError = false;
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
    const formData = new FormData();

    this.participantRangeError = false;
    const min = this.event.minParticipants;
    const max = this.event.maxParticipants;
    if (min != null && max != null && max < min) {
      this.participantRangeError = true;
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

    this.userAgeOutOfRangeError = false;
    const userAge = this.getUserAge();
    console.log('Âge de l’utilisateur :', userAge);
    if (
      (this.event.minAge != null && userAge < this.event.minAge) ||
      (this.event.maxAge != null && userAge > this.event.maxAge)
    ) {
      this.userAgeOutOfRangeError = true;
      return;
    }
    this.minAgeError = false;
    if (this.event.minAge != null && (this.event.minAge < 16)) {
      this.minAgeError = true;
      return;
    }

    if (this.event.visibility === 'GROUP' && !this.event.groupId) {
      this.groupSelectionError = true;
      return;
    }

    if (this.event.visibility === 'CUSTOM' && (!this.event.invitedUserIds || this.event.invitedUserIds.length === 0)) {
      this.invitedContactsError = true;
      return;
    }

    const dto = {
      ...this.event,
      date: `${this.event.date.year}-${String(this.event.date.month).padStart(2, '0')}-${String(this.event.date.day).padStart(2, '0')}`
    };


    console.log('Location envoyée :', this.event.location);

    // Ajouter l'objet EventForm comme champ JSON
    formData.append('event', new Blob([JSON.stringify(dto)], { type: 'application/json' }));

    // Ajouter le fichier image si présent
    if (this.selectedFile) {
      formData.append('image', this.selectedFile);
    }

    this.loading = true;

    this.http.post(`${environment.apiUrl}/events`, formData)
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
            invitedUserIds: [],
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


    const minAge = Math.max(16, age - 10);
    const maxAge = Math.min(100, age + 10);

    if (age > 20) {
      this.event.minAge = 18;
    } else {
      this.event.minAge = minAge;
    }
    this.event.maxAge = maxAge;
  }

    getUserAge(): number {
    const birthDate = new Date(this.currentUser.birthDate); // YYYY-MM-DD
    const today = new Date();

    let age = today.getFullYear() - birthDate.getFullYear();
    console.log('Date de naissance de l’utilisateur :', birthDate);
    const hasHadBirthday =
      today.getMonth() > birthDate.getMonth() ||
      (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate());

    if (!hasHadBirthday) {
      age--;
    }

    return age;
  }

}