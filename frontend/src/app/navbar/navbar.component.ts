import { Component, EventEmitter, Output } from '@angular/core';
import { AuthService } from '../auth.service';
import jwt_decode from 'jwt-decode';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
  constructor(private authService: AuthService) {}

  @Output() toggleFiltersPanel = new EventEmitter<void>();

  isUserLoggedIn: boolean = false;
  user: any = null;
  environment = environment;

  ngOnInit(): void {
    this.isUserLoggedIn = this.authService.isLoggedIn();
    const token = this.authService.getToken();
    if (token) {
      try {
        const decoded: any = jwt_decode(token);
        this.user = decoded;
        console.log('Utilisateur décodé :', this.user);
        console.log('Nom du fichier photo :', this.user?.photoFilename);
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
