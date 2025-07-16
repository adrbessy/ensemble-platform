import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { MessageService } from '../message.service';
import { environment } from 'src/environments/environment';
import { NotificationService } from '../services/notification.service';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html'
})
export class SignupComponent {
  email = '';
  firstName = '';
  password = '';

  constructor(
    private http: HttpClient,
    private router: Router,
    private notificationService: NotificationService
  ) {}

  register() {
    const user = {
      email: this.email,
      firstName: this.firstName,
      password: this.password
    };

    this.http.post(`${environment.apiUrl}/api/auth/register`, user)
      .subscribe({
        next: () => {
          this.notificationService.success("Inscription réussie !");
          this.router.navigate(['/login']);
        },
        error: (err) => {
          this.notificationService.error('Erreur lors de l\'inscription.');
          console.error(err);
        }
      });
  }
}
