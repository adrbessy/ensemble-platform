import { Component, EventEmitter, Output } from '@angular/core';
import { AuthService } from '../auth.service';
import jwt_decode from 'jwt-decode';
import { environment } from 'src/environments/environment';
import { UserService } from '../services/user.service';
import { User } from '../models/user.model';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
  constructor(private authService: AuthService, private userService: UserService) {}

  @Output() toggleFiltersPanel = new EventEmitter<void>();
  timestamp = Date.now();

  isUserLoggedIn: boolean = false;
  user: User | null = null;
  environment = environment;

  ngOnInit(): void {
    this.userService.user$.subscribe((user) => {
      this.user = user;
      if (user) {
        this.isUserLoggedIn = true;
        this.timestamp = Date.now(); // 🔁 force le rafraîchissement de l'avatar
      } else {
        this.isUserLoggedIn = false;
      }
    });

    // ⚠️ Initialiser le profil s’il est connecté
    if (this.authService.isLoggedIn()) {
      this.userService.getMyProfile().subscribe({
        next: (user) => this.userService.setUser(user),
        error: () => this.userService.setUser(null)
      });
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
