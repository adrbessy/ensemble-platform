import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html'
})
export class LoginComponent {
  email = '';
  password = '';

  constructor(private http: HttpClient) {}

  login() {
    const credentials = {
      email: this.email,
      password: this.password
    };

    this.http.post<any>('http://localhost:8080/api/auth/login', credentials)
      .subscribe({
        next: (response) => {
          localStorage.setItem('token', response.token);
          console.log('Token enregistré :', response.token);
          console.log('Connexion réussie !');
        },
        error: (err) => {
          console.error('Erreur de connexion', err);
        }
      });
  }
}
