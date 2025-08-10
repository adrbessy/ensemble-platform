import { Component, Input, Output, EventEmitter } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-friends-modal',
  templateUrl: './friends-modal.component.html',
  styleUrls: ['./friends-modal.component.css']
})
export class FriendsModalComponent {
  @Input() contacts: any[] = [];
  @Output() removed = new EventEmitter<number>();   // optionnel: prévenir le parent
  isBusy = false;

  constructor(public activeModal: NgbActiveModal, private userService: UserService) {}

  removeFriend(contact: any) {
    if (this.isBusy) return;
    const ok = confirm(`Retirer ${contact.firstName} ${contact.lastName} de vos ami(e)s ?`);
    if (!ok) return;

    this.isBusy = true;

    // Optimiste: on enlève tout de suite de la liste
    const prev = [...this.contacts];
    this.contacts = this.contacts.filter(c => c.id !== contact.id);

    this.userService.removeFriend(contact.id).subscribe({
      next: () => {
        this.isBusy = false;
        this.removed.emit(contact.id);   // optionnel
      },
      error: err => {
        this.isBusy = false;
        this.contacts = prev;            // rollback
        console.error(err);
        alert("Impossible de retirer cet(te) ami(e) pour l’instant.");
      }
    });
  }
}
