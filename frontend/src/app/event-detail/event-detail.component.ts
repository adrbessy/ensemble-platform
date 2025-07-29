import { ActivatedRoute, Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { EventService } from '../event.service';
import { AuthService } from '../auth.service';
import { ConfirmModalComponent } from '../confirm-modal/confirm-modal.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NotificationService } from '../services/notification.service';

@Component({
  selector: 'app-event-detail',
  templateUrl: './event-detail.component.html'
})
export class EventDetailComponent implements OnInit {
  event: any;

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
      });
    }
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



}

