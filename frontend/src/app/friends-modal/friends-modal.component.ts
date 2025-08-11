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
    if (!confirm(`Retirer ${contact.firstName} ${contact.lastName} de vos ami(e)s ?`)) return;

    this.isBusy = true;

    // ✅ mutation in-place => le parent voit le changement
    const idx = this.contacts.findIndex(c => c.id === contact.id);
    if (idx > -1) this.contacts.splice(idx, 1);

    this.userService.removeFriend(contact.id).subscribe({
      next: () => {
        this.isBusy = false;
        this.removed.emit(contact.id);   // prévenir le parent
      },
      error: err => {
        this.isBusy = false;
        console.error(err);
        alert("Impossible de retirer cet(te) ami(e) pour l’instant.");
        // (optionnel) recharger la liste si besoin
        // this.activeModal.dismiss();
      }
    });
  }

  ageOf(c: any): number | null {
    const d = c?.birthdate;
    if (!d) return null;

    const bd = new Date(d); // accepte 'YYYY-MM-DD' ou ISO
    if (isNaN(bd.getTime())) return null;

    const today = new Date();
    let age = today.getFullYear() - bd.getFullYear();
    const m = today.getMonth() - bd.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < bd.getDate())) age--;
    return age;
  }

}
