import { ActivatedRoute, Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { EventService, Event as AppEvent } from '../event.service';
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
  event: AppEvent | null = null;
  map: L.Map | null = null;

  constructor(
    private route: ActivatedRoute,
    private eventService: EventService,
    private authService: AuthService,
    private router: Router,
    private modalService: NgbModal,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.eventService.getEventById(+id).subscribe((ev: AppEvent) => {
        this.event = ev;
        setTimeout(() => this.initMap(), 0);
      });
    }
  }

  initMap(): void {
    const lat = this.event?.latitude;
    const lng = this.event?.longitude;
    if (lat == null || lng == null) return;

    const container = document.getElementById('eventMap');
    if (!container) return;

    this.map = L.map(container).setView([lat, lng], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    L.marker([lat, lng]).addTo(this.map)
      .bindPopup(this.event?.title || 'Lieu de l’événement');
  }

  hasUserParticipated(ev: AppEvent): boolean {
    const currentUserId = this.authService.getCurrentUserId();
    return !!ev.participants?.some(p => p.id === currentUserId);
  }

  withdraw(ev: AppEvent): void {
    const modalRef = this.modalService.open(ConfirmModalComponent);
    modalRef.componentInstance.title = 'Désinscription';
    modalRef.componentInstance.message = 'Souhaites-tu vraiment te désinscrire de cet événement ?';

    const currentUserId = this.authService.getCurrentUserId();
    modalRef.result.then(result => {
      if (result === true) {
        this.eventService.withdrawParticipation(ev.id).subscribe({
          next: () => {
            ev.participants = ev.participants.filter(u => u.id !== currentUserId);
            if (ev.participants.length === 0) {
              this.eventService.deleteEvent(ev.id).subscribe({
                next: () => this.notificationService.success('Activité supprimée (aucun participant).'),
                error: () => this.notificationService.error('Erreur lors de la suppression de l’activité.')
              });
              this.router.navigate(['/']);
            } else {
              this.notificationService.success('Désinscription réussie !');
            }
          },
          error: () => this.notificationService.error('Erreur lors de la désinscription.')
        });
      }
    }).catch(() => {});
  }

  participate(ev: AppEvent): void {
    this.eventService.participate(ev.id).subscribe({
      next: () => {
        const user = this.authService.getCurrentUser();
        ev.participants = ev.participants || [];
        if (!ev.participants.some(p => p.id === user.id)) {
          ev.participants.push({ id: user.id, gender: user.gender });
        }
        console.log('Inscription réussie !');
      },
      error: err => console.error('Erreur lors de l’inscription :', err)
    });
  }

  openEventChat(eventId: number) {
    this.eventService.openEventChat(eventId).subscribe({
      next: conv => this.router.navigate(['/messagerie'], { queryParams: { conv: conv.conversationId } }),
      error: () => this.notificationService.error('Impossible d’ouvrir le chat de l’événement.')
    });
  }
}
