import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { MessageService } from '../message.service';
import { environment } from 'src/environments/environment';

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
    private messageService: MessageService
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
          this.messageService.showMessage('Inscription réussie !');
          this.router.navigate(['/login']);
        },
        error: (err) => {
          this.messageService.showMessage('Erreur lors de l\'inscription.');
          console.error(err);
        }
      });
  }
}
