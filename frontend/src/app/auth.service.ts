import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import jwt_decode from 'jwt-decode';
import { NotificationService } from './services/notification.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private tokenKey = 'token';

  constructor(private http: HttpClient, private notificationService: NotificationService, private router: Router) {}

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
  this.loggedIn$.next(false);
  localStorage.removeItem(this.tokenKey);
  this.notificationService.info("Déconnexion réussie.");
  this.router.navigate(['/login']); // redirection Angular
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
  

}
