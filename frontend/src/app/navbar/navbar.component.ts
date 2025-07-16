import { Component, EventEmitter, Output } from '@angular/core';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
})
export class NavbarComponent {
  constructor(private authService: AuthService) {}

  @Output() toggleFiltersPanel = new EventEmitter<void>();

  isUserLoggedIn: boolean = false;

  ngOnInit(): void {
    this.isUserLoggedIn = this.authService.isLoggedIn();
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
