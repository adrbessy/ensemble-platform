import { Component } from '@angular/core';
import { AuthService } from './auth.service';
import { MessageService } from './message.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html'
})
export class AppComponent {
  constructor(public authService: AuthService, public messageService: MessageService) {}

  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }
}
