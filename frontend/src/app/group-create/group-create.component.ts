import { Component } from '@angular/core';
import { GroupService } from '../services/group.service';

@Component({
  selector: 'app-group-create',
  templateUrl: './group-create.component.html'
})
export class GroupCreateComponent {
  name = '';
  isPrivate = false;
  successMessage = '';

  constructor(private groupService: GroupService) {}

  submitForm() {
    const data = {
      name: this.name,
      private: this.isPrivate
    };

    this.groupService.createGroup(data).subscribe({
      next: () => {
        this.successMessage = 'Groupe créé avec succès !';
        this.name = '';
        this.isPrivate = false;
      },
      error: (err) => {
        console.error('Erreur création groupe :', err);
      }
    });
  }
}
