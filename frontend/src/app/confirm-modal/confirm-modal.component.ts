import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-confirm-modal',
  templateUrl: './confirm-modal.component.html'
})
export class ConfirmModalComponent {
  @Input() title: string = 'Confirmation';
  @Input() message: string = 'Es-tu sûr(e) de vouloir continuer ?';

  constructor(public activeModal: NgbActiveModal) {}
}
