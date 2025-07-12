import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import jwt_decode from 'jwt-decode';
import { MessageService } from './message.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private tokenKey = 'token';

  constructor(private messageService: MessageService, private router: Router) {}

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

    logout(): void {
    localStorage.removeItem(this.tokenKey);
    this.messageService.showMessage('Déconnexion réussie.');
    this.router.navigate(['/login']); // redirection Angular
    }

  getCurrentUserId(): number | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      const decoded: any = jwt_decode(token);
      return decoded.id || null;
    } catch (error) {
      console.error('Erreur lors du décodage du token :', error);
      return null;
    }
  }

  getUserEmail(): string | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      const decoded: any = jwt_decode(token);
      return decoded.sub || null; // sub = subject = email
    } catch (error) {
      return null;
    }
  }

    getDisplayName(): string | null {
        const token = this.getToken();
        if (!token) return null;

        try {
            const decoded: any = jwt_decode(token);
            return decoded.sub || null;
        } catch (error) {
            console.error('Erreur lors du décodage du token :', error);
            return null;
        }
    }
}
