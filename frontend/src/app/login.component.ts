import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { MessageService } from './message.service';
import { environment } from 'src/environments/environment';
import { NotificationService } from './services/notification.service';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html'
})
export class LoginComponent {
  email = '';
  password = '';

  constructor(private http: HttpClient, private router: Router, private notificationService: NotificationService, private authService: AuthService) {}

  login() {
    const credentials = {
      email: this.email,
      password: this.password
    };

    this.http.post<any>(`${environment.apiUrl}/api/auth/login`, credentials)
      .subscribe({
        next: (response) => {
            localStorage.setItem('token', response.token);
            this.authService.setLoggedIn(true);
            // 👉 Message de confirmation
            this.notificationService.success("Connexion réussie");

            // 👉 Redirection vers la liste des événements
            this.router.navigate(['/events']); // ✅ Redirection ici
        },
        error: (err) => {
            this.notificationService.error("Email ou mot de passe incorrect.");
            console.error('Erreur de connexion', err);
        }
      });
  }
}
