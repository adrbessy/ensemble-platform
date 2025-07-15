import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { MessageService } from './message.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html'
})
export class LoginComponent {
  email = '';
  password = '';

  constructor(private http: HttpClient, private router: Router, private messageService: MessageService) {}

  login() {
    const credentials = {
      email: this.email,
      password: this.password
    };

    this.http.post<any>('/api/auth/login', credentials)
      .subscribe({
        next: (response) => {
            localStorage.setItem('token', response.token);

            // 👉 Message de confirmation
            this.messageService.showMessage('Connexion réussie !');

            // 👉 Redirection vers la liste des événements
            this.router.navigate(['/events']); // ✅ Redirection ici
        },
        error: (err) => {
            this.messageService.showMessage('Email ou mot de passe incorrect.');
            console.error('Erreur de connexion', err);
        }
      });
  }
}
