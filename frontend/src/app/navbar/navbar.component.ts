import { Component, EventEmitter, Output } from '@angular/core';
import { AuthService } from '../auth.service';
import jwt_decode from 'jwt-decode';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
})
export class NavbarComponent {
  constructor(private authService: AuthService) {}

  @Output() toggleFiltersPanel = new EventEmitter<void>();

  isUserLoggedIn: boolean = false;
  user: any = null;

  ngOnInit(): void {
    this.isUserLoggedIn = this.authService.isLoggedIn();
    const token = this.authService.getToken();
    if (token) {
      try {
        const decoded: any = jwt_decode(token);
        this.user = decoded;
      } catch (error) {
        console.error('Erreur lors du décodage du token :', error);
      }
    }
  }

  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  logout(): void {
    this.authService.logout();
  }

  getUserEmail(): string | null {
    return this.authService.getUserEmail();
  }

  getDisplayName(): string | null {
    return this.authService.getDisplayName();
  }

  toggleFilters() {
    this.toggleFiltersPanel.emit();
  }
}
