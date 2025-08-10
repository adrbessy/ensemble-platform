import { Component, EventEmitter, HostListener, Output } from '@angular/core';
import { AuthService } from '../auth.service';
import jwt_decode from 'jwt-decode';
import { environment } from 'src/environments/environment';
import { UserService } from '../services/user.service';
import { User } from '../models/user.model';
import { ChatService } from '../services/chat.service';
import { combineLatest, tap } from 'rxjs'; // 👈
import { dbg } from '../debug';

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
    this.chatService.badge$
      .pipe(tap(v => dbg(`NAV:badge$ -> ${v}`)))
      .subscribe(v => this.hasUnreadMessages = v);

    this.userService.user$
      .pipe(tap(u => dbg(`NAV:user$ ->`, u ? {id: u.id, email: u.email} : null)))
      .subscribe(async user => {
        this.user = user;
        this.isUserLoggedIn = !!user;

        if (!user) {
          dbg('NAV:logout detected -> resetAllStates');
          this.chatService.resetAllStates();
          this.lastInitUserId = undefined;
          return;
        }

        if (this.lastInitUserId !== user.id) {
          dbg(`NAV:initForUser(${user.id})`);
          await this.chatService.initForUser(user.id);
          this.lastInitUserId = user.id;
        }

        this.timestamp = Date.now();
      });

    this.userService.getMyProfile().subscribe({
      next: (user) => this.userService.setUser(user),
      error: () => this.userService.setUser(null)
    });
  }

  @HostListener('window:focus')
  async onFocus() {
    dbg('NAV:window focus');
    if (this.isUserLoggedIn) await this.chatService.refreshUnreadFromServer();
  }

  @HostListener('document:visibilitychange')
  async onVisibility() {
    dbg(`NAV:visibility ${document.visibilityState}`);
    if (document.visibilityState === 'visible' && this.isUserLoggedIn) {
      await this.chatService.refreshUnreadFromServer();
    }
  }

  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  logout(): void {
    dbg('NAV:logout clicked');
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
