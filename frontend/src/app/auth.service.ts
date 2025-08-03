import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import jwt_decode from 'jwt-decode';
import { NotificationService } from './services/notification.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { UserService } from './services/user.service';
import { User } from './models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private tokenKey = 'token';
  private currentUser: any = null;

  constructor(private http: HttpClient, private notificationService: NotificationService, private router: Router,
  private userService: UserService ) {}

  private loggedIn$ = new BehaviorSubject<boolean>(this.isLoggedIn());

  getLoggedIn(): Observable<boolean> {
    return this.loggedIn$.asObservable();
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    this.currentUser = null;
    this.loggedIn$.next(false);
    this.userService.setUser(null); // 🧹 Réinitialise l’utilisateur global
    this.notificationService.info("Déconnexion réussie.");
    this.router.navigate(['/login']);
  }

  setLoggedIn(value: boolean): void {
    this.loggedIn$.next(value);
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

  register(formData: FormData): Observable<any> {
    return this.http.post(`${environment.apiUrl}/auth/signup`, formData);
  }

  getDecodedToken(): any {
    const token = localStorage.getItem(this.tokenKey);
    if (!token) {
      this.currentUser = null;
      return null;
    }

    try {
      const payload = token.split('.')[1];
      this.currentUser = JSON.parse(atob(payload));
      return this.currentUser;
    } catch (e) {
      console.error('Erreur lors du décodage du token', e);
      this.currentUser = null;
      return null;
    }
  }

  getCurrentUser(): any {
    if (!this.currentUser) {
      this.getDecodedToken();
    }
    return this.currentUser;
  }

  refreshCurrentUser(): void {
    this.http.get<User>(`${environment.apiUrl}/users/me`).subscribe({
      next: (user) => {
        localStorage.setItem('currentUser', JSON.stringify(user));
      },
      error: (err) => {
        console.error("Erreur lors du rafraîchissement de l'utilisateur :", err);
      }
    });
  }

  

}
