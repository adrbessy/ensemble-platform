
import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { EventService } from '../event.service';
import { AuthService } from '../auth.service';
import { Input } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmModalComponent } from '../confirm-modal/confirm-modal.component';
import { environment } from 'src/environments/environment';
import { NotificationService } from '../services/notification.service';

@Component({
  selector: 'app-event-list',
  templateUrl: './event-list.component.html'
})
export class EventListComponent implements OnInit {
  events: any[] = [];
  currentUserId: number;
  onlyWithRemainingSpots = true;
  @Input() showFilters: boolean = false;

  constructor(private http: HttpClient, private eventService: EventService, private authService: AuthService, private modalService: NgbModal,
  private notificationService: NotificationService) {
    this.currentUserId = this.authService.getCurrentUserId();
  }

  ngOnInit(): void {
    this.loadEvents();
    this.currentUserId = this.authService.getCurrentUserId();
    this.eventService.refreshEvents$.subscribe(() => {
      this.loadEvents();
    });
  }

  loadEvents() {
    this.http.get<any[]>(`${environment.apiUrl}/api/events`)
      .subscribe(data => this.events = data);
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
  }

  toggleFiltersPanel() {
    this.showFilters = !this.showFilters;
  }

}
