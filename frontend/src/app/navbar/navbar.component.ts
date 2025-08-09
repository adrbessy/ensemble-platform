import { Component, EventEmitter, HostListener, Output } from '@angular/core';
import { AuthService } from '../auth.service';
import jwt_decode from 'jwt-decode';
import { environment } from 'src/environments/environment';
import { UserService } from '../services/user.service';
import { User } from '../models/user.model';
import { ChatService } from '../services/chat.service';
import { combineLatest } from 'rxjs'; // 👈

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
  constructor(private authService: AuthService, private userService: UserService,
    private chatService: ChatService
  ) {}

  @Output() toggleFiltersPanel = new EventEmitter<void>();
  timestamp = Date.now();

  isUserLoggedIn: boolean = false;
  user: User | null = null;
  environment = environment;
  hasUnreadMessages: boolean = false;
  private lastInitUserId?: number;

  ngOnInit(): void {
    // 1) Badge prêt à l’emploi (mémoïsé dans le service)
    this.chatService.badge$.subscribe(v => this.hasUnreadMessages = v);

    // 2) Réagit aux changements d’utilisateur
    this.userService.user$.subscribe(async user => {
      this.user = user;
      this.isUserLoggedIn = !!user;

      if (!user) {
        this.chatService.resetAllStates();   // nettoie tout à la déconnexion
        this.lastInitUserId = undefined;
        return;
      }

      // Init du chat une seule fois par utilisateur
      if (this.lastInitUserId !== user.id) {
        await this.chatService.initForUser(user.id);
        this.lastInitUserId = user.id;
      }

      // rafraîchit l’avatar si besoin
      this.timestamp = Date.now();
    });

    // 3) Toujours tenter de charger le profil (pas besoin de tester isLoggedIn)
    this.userService.getMyProfile().subscribe({
      next: (user) => this.userService.setUser(user),
      error: () => this.userService.setUser(null)
    });
  }

  @HostListener('window:focus')
  async onFocus() {
    if (this.isUserLoggedIn) {
      await this.chatService.refreshUnreadFromServer();
    }
  }

  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  logout(): void {
    this.chatService.resetAllStates();
    this.hasUnreadMessages = false;
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
