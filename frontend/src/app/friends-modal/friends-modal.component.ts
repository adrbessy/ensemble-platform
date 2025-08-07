import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-friends-modal',
  templateUrl: './friends-modal.component.html',
  styleUrls: ['./friends-modal.component.css']
})
export class FriendsModalComponent {
  @Input() contacts: any[] = [];

  constructor(public activeModal: NgbActiveModal) {}
}
