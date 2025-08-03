import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-location-selector',
  templateUrl: './location-selector.component.html',
  styleUrls: ['./location-selector.component.css']
})
export class LocationSelectorComponent implements OnInit  {
  search: string = '';
  suggestions: string[] = [];
  selectedCity: string = '';
  radius: number = 10;
  showPopup = false;

  @Input() initialRadius: number = 10;
  @Input() initialCity: string = '';


  @Output() locationChange = new EventEmitter<{ city: string; radius: number; latitude?: number; longitude?: number }>();
  @Output() clearLocation = new EventEmitter<void>();

  ngOnInit(): void {
  this.radius = this.initialRadius;
  this.selectedCity = this.initialCity;
  this.search = this.initialCity;
}


  togglePopup() {
    this.showPopup = !this.showPopup;
  }

  onSearch() {
    if (this.search.length < 2) {
      this.suggestions = [];
      return;
    }

    fetch(`https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(this.search)}&fields=nom&limit=5`)
      .then(res => res.json())
      .then(data => {
        this.suggestions = data.map((c: any) => c.nom);
      });
  }

  selectCity(city: string) {
    this.selectedCity = city;
    this.search = city;
    this.suggestions = [];
    this.locationChange.emit({ city, radius: this.radius });
    this.showPopup = false;
  }


  validate() {
    this.showPopup = false;

    if (!this.selectedCity) {
      // Si aucune ville sélectionnée, on utilise la géolocalisation
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          this.locationChange.emit({
            city: '', // pas de ville
            radius: this.radius,
            latitude: lat,
            longitude: lng
          });
        },
        (error) => {
          alert('La géolocalisation a échoué. Veuillez autoriser l’accès à votre position.');
          console.error("Erreur de géolocalisation :", error);
        },
        { timeout: 7000 }
      );
    } else {
      // Ville sélectionnée
      this.locationChange.emit({
        city: this.selectedCity,
        radius: this.radius
      });
    }
  }


  clear() {
    this.selectedCity = '';
    this.search = '';
    this.radius = 10;
    this.suggestions = [];
    this.clearLocation.emit();
    this.showPopup = false;
  }

  selectRadius(radius: number) {
    console.log('✅ selectRadius appelé avec rayon :', radius);
    this.radius = radius;

    this.selectedCity = '';
    this.search = '';

    // ✅ Vérifie s’il y a une position en cache
    const cachedLat = localStorage.getItem('userLatitude');
    const cachedLng = localStorage.getItem('userLongitude');

    if (cachedLat && cachedLng) {
      console.log('🗺️ Utilisation de la géoloc cachée');
      this.locationChange.emit({
        city: '',
        radius,
        latitude: parseFloat(cachedLat),
        longitude: parseFloat(cachedLng)
      });
      this.showPopup = false;
      return;
    }

    // Sinon, géolocalisation réelle
    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('📍 Géolocalisation OK');

        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        // 🧠 Sauvegarde en cache
        localStorage.setItem('userLatitude', lat.toString());
        localStorage.setItem('userLongitude', lng.toString());

        this.locationChange.emit({
          city: '',
          radius,
          latitude: lat,
          longitude: lng
        });

        this.showPopup = false;
      },
      (error) => {
        console.error('❌ Échec géolocalisation', error);
        alert('La géolocalisation a échoué. Veuillez autoriser l’accès à votre position.');
      },
      { timeout: 7000 }
    );
  }



getFilterLabel(): string {
  if (this.selectedCity) {
    return this.selectedCity;
  }

  if (this.radius <= 5) return '< 5 km';
  if (this.radius <= 10) return '< 10 km';
  return '< 20 km';
}


  
}
