import { ActivatedRoute, Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { EventService } from '../event.service';
import { AuthService } from '../auth.service';
import { ConfirmModalComponent } from '../confirm-modal/confirm-modal.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NotificationService } from '../services/notification.service';
import * as L from 'leaflet';

delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
});

@Component({
  selector: 'app-event-detail',
  templateUrl: './event-detail.component.html',
  styleUrls: ['./event-detail.component.css']
})
export class EventDetailComponent implements OnInit {
  event: any;
  map: any;

  constructor(
  private route: ActivatedRoute,
  private eventService: EventService,
  private authService: AuthService,
  private router: Router, private modalService: NgbModal,private notificationService: NotificationService
) {}


  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.eventService.getEventById(+id).subscribe(event => {
        this.event = event;

        setTimeout(() => {
          this.initMap();
        }, 0);

      });
    }
  }

  initMap(): void {
    const lat = this.event?.latitude;
    const lng = this.event?.longitude;

    if (!lat || !lng) {
      console.warn("Latitude ou longitude manquantes.");
      return;
    }

    const container = document.getElementById('eventMap');
    if (!container) {
      console.error("❌ Le conteneur #eventMap est introuvable dans le DOM.");
      return;
    }

    this.map = L.map(container).setView([lat, lng], 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    L.marker([lat, lng]).addTo(this.map)
      .bindPopup(this.event.title || 'Lieu de l’événement');
  }


  hasUserParticipated(event: any): boolean {
    const currentUserId = this.authService.getCurrentUserId();
    return event.participants?.some((p: any) => p.id === currentUserId);
  }

  withdraw(event: any): void {
    const modalRef = this.modalService.open(ConfirmModalComponent);
    modalRef.componentInstance.title = "Désinscription";
    modalRef.componentInstance.message = "Souhaites-tu vraiment te désinscrire de cet événement ?";
    const currentUserId = this.authService.getCurrentUserId();

        modalRef.result.then(
      (result) => {
        if (result === true) {
          this.eventService.withdrawParticipation(event.id).subscribe({
            next: () => {
              // Retirer l'utilisateur localement
              event.participants = event.participants.filter((user: any) => user.id !== currentUserId);

              if (event.participants.length === 0) {
                // Supprimer l'événement côté serveur
                this.eventService.deleteEvent(event.id).subscribe(() => {
                  this.notificationService.success("Activité supprimée (aucun participant).");
                }, error => {
                  this.notificationService.error("Erreur lors de la suppression de l’activité.");
                });
                this.router.navigate(['/']);
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
      }
    );
  }


  participate(event: any): void {
    this.eventService.participate(event.id).subscribe({
      next: () => {
        const user = this.authService.getCurrentUser();
        event.participants = event.participants || [];
        event.participants.push({
          id: user.id,
          username: user.username,
          photoFilename: user.photoFilename
        });
        console.log("Inscription réussie !");
      },
      error: err => {
        console.error("Erreur lors de l'inscription :", err);
      }
    });
  }

  getImageUrl(imageUrl: string): string {
    if (!imageUrl) return '';
    return imageUrl.startsWith('/uploads/images/')
      ? 'http://localhost:8080' + imageUrl
      : 'http://localhost:8080/uploads/images/' + imageUrl;
  }


}

