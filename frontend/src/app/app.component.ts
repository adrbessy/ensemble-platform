import { Component } from '@angular/core';
import { AuthService } from './auth.service';
import { MessageService } from './message.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html'
})
export class AppComponent {

  showFilters = false;

  constructor(public authService: AuthService, public messageService: MessageService) {}

  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

    toggleFilters() {
    this.showFilters = !this.showFilters;
    console.log('toggleFilters appelé. Nouvelle valeur :', this.showFilters);
  }
}
