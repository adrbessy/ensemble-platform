import { Component, EventEmitter, HostListener, Output } from '@angular/core';
import { AuthService } from '../auth.service';
import jwt_decode from 'jwt-decode';
import { environment } from 'src/environments/environment';
import { UserService } from '../services/user.service';
import { User } from '../models/user.model';
import { ChatService } from '../services/chat.service';
import { combineLatest, tap } from 'rxjs';
import { dbg } from '../debug';
import { filter, Subscription, interval } from 'rxjs';
import { switchMap, startWith, take } from 'rxjs/operators';
import { NotificationService } from '../services/notification.service';
import { Router } from '@angular/router';
import { EventInvite } from '../models/event-invite.model';
import { EventService } from '../event.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
  constructor(private authService: AuthService, private userService: UserService,
    private chatService: ChatService,  private notificationService: NotificationService,
  private router: Router, private eventService: EventService
  ) {}

  @Output() toggleFiltersPanel = new EventEmitter<void>();
  timestamp = Date.now();

  isUserLoggedIn: boolean = false;
  user: User | null = null;
  environment = environment;
  hasUnreadMessages: boolean = false;
  private lastInitUserId?: number;
  private frSub?: Subscription;
  private seenRequestIds = new Set<number>(); // pour ne notifier qu’une fois
  private firstRun = true;
  notificationCount = 0;
  pendingFriendRequests: any[] = [];
  private notifiedRequestIds = new Set<number>(); // NEW: pour ne toster qu'une fois
  menuUnseenCount = 0;
  private seenInviteIds = new Set<number>();
  private notifiedInviteIds = new Set<number>();
  invites: EventInvite[] = [];
  private firstRunInvites = true;


  private keyFor(userId: number) { return `fr:seen:${userId}`; }

  ngOnInit(): void {
    this.chatService.badge$
      .pipe(tap(v => dbg(`NAV:badge$ -> ${v}`)))
      .subscribe(v => this.hasUnreadMessages = v);

    this.userService.user$
      .pipe(tap(u => dbg(`NAV:user$ ->`, u ? { id: u.id, email: u.email } : null)))
      .subscribe(async user => {
        this.user = user;
        this.isUserLoggedIn = !!user;

        // charger le compteur serveur au démarrage
        if (this.isUserLoggedIn) {
          this.notificationService.getCount()
            .subscribe(r => this.notificationCount = r.count);
        }

        if (!user) {
          dbg('NAV:logout detected -> resetAllStates');
          this.chatService.resetAllStates();
          this.lastInitUserId = undefined;
          this.frSub?.unsubscribe();
          this.notificationCount = 0;
          return;
        }

        if (this.lastInitUserId !== user.id) {
          dbg(`NAV:initForUser(${user.id})`);
          await this.chatService.initForUser(user.id);

          // load seen IDs for THIS user and (re)arm first-run
          this.loadSeen(user.id);
          this.firstRun = true;

          // 🔹 immediate fetch so the bell updates right away
          this.userService.getFriendRequests().subscribe(reqs => {
            this.handleFriendRequests(reqs ?? []);
          });
          this.userService.getEventInvites().subscribe(inv => {
            this.handleEventInvites(inv ?? []);
          });

          // 🔁 start polling for updates
          this.startFriendRequestPolling();

          this.lastInitUserId = user.id;
          this.firstRunInvites = true;      // réarme pour ce user
          this.loadToastSeen(user.id);      // voir §2
        }

        this.timestamp = Date.now();
      });

      this.userService.getMyProfile().subscribe({
        next: (user) => this.userService.setUser(user),
        error: () => this.userService.setUser(null)
      });
    }

  ngOnDestroy(): void {
    this.frSub?.unsubscribe();
    this.invitesSub?.unsubscribe();
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

  private updateNotificationCount(friendRequests?: any[]) {
    // if a list is passed, refresh the local pending list (friend requests)
    if (friendRequests) {
      this.pendingFriendRequests = (friendRequests || []).filter(r => !r.accepted);
    }

    const unseenFR  = (this.pendingFriendRequests || [])
      .filter(r => !this.seenRequestIds.has(r.id)).length;

    const unseenInv = (this.invites || [])
      .filter(i => !this.seenInviteIds.has(i.id)).length;

    this.notificationCount = unseenFR + unseenInv;
  }

  private loadSeen(userId: number) {
    try {
      const raw = localStorage.getItem(this.keyFor(userId));
      if (!raw) return;
      const arr: number[] = JSON.parse(raw);
      this.seenRequestIds = new Set(arr);
    } catch {}
  }

  private saveSeen(userId: number) {
    try {
      localStorage.setItem(this.keyFor(userId), JSON.stringify([...this.seenRequestIds]));
    } catch {}
  }

  private handleFriendRequests(reqs: any[]) {
    const pending = (reqs || []).filter(r => !r.accepted);
    this.pendingFriendRequests = pending;

    // ➜ N'affecte PAS seenRequestIds ici.
    //    On se limite à montrer un toast pour celles qu'on n'a pas déjà notifiées
    const newOnes = pending.filter(r => !this.notifiedRequestIds.has(r.id));
    for (const r of newOnes) {
      this.notifiedRequestIds.add(r.id);
      const fromName = r.sender?.firstName
        ? `${r.sender.firstName} ${r.sender.lastName ?? ''}`.trim()
        : 'Nouvel utilisateur';
      this.notificationService.friendRequest(fromName, () => {
        this.router.navigate(['/mon-profil'], { queryParams: { focus: 'requests' } });
      });
    }

    this.firstRun = false; // on peut désarmer le flag
    // PAS de saveSeen() ici
  }

  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  logout(): void {
    dbg('NAV:logout clicked');
    this.chatService.resetAllStates();
    this.hasUnreadMessages = false;
    this.authService.logout();
    this.frSub?.unsubscribe();
    this.seenRequestIds.clear();
    this.notificationCount = 0;
    this.notifiedInviteIds.clear();
    if (this.user) localStorage.removeItem(this.toastKey(this.user.id));
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

  private refreshFriendRequestsNow() {
    this.userService.getFriendRequests().subscribe(reqs => {
      this.handleFriendRequests(reqs ?? []);
      this.updateNotificationCount(reqs ?? []);
    });
  }

  private invitesSub?: Subscription;

  private startFriendRequestPolling() {
    this.frSub?.unsubscribe();
    this.frSub = interval(30000).pipe(
      startWith(0),
      switchMap(() => this.userService.getFriendRequests()),
    ).subscribe(reqs => {
      this.handleFriendRequests(reqs ?? []);
    });

    this.invitesSub?.unsubscribe();
    this.invitesSub = interval(30000).pipe(
      startWith(0),
      switchMap(() => this.notificationService.getInvites())
    ).subscribe(invites => {
      this.handleEventInvites(invites ?? []);
      // 🔁 récupère le compteur depuis le serveur
      this.notificationService.getCount().subscribe(r => this.notificationCount = r.count);
    });
  }

  onDropdownOpen(open: boolean) {
    if (!open) return;
    this.notificationService.markAllRead().subscribe(() => {
      this.notificationCount = 0;
      this.notificationService.getInvites().subscribe(inv => {
        this.handleEventInvites(inv ?? []);
        this.notifiedInviteIds.clear();       // ✅ on repart propre
        this.saveToastSeen();
        this.firstRunInvites = true;          // évite un toast immédiat après reload des invites
      });
    });
  }

  private markNotificationsSeen() {
    (this.pendingFriendRequests || []).forEach(r => this.seenRequestIds.add(r.id));
    (this.invites || []).forEach(i => this.seenInviteIds.add(i.id));
    if (this.user) this.saveSeen(this.user.id);
    this.updateNotificationCount();
  }

  private handleEventInvites(invites: EventInvite[]) {
    // garde l’affichage
    this.invites = invites.filter(i => i.status === 'PENDING');

    // 🔒 ne JAMAIS toaster au premier fetch (au reload)
    if (this.firstRunInvites) {
      this.firstRunInvites = false;
      return;
    }

    // toasts uniquement pour les invitations non lues
    const unread = this.invites.filter(i => !i.readAt);
    const newOnes = unread.filter(i => !this.notifiedInviteIds.has(i.id));

    for (const i of newOnes) {
      this.notifiedInviteIds.add(i.id);
      this.saveToastSeen(); // voir §2
      this.notificationService.eventInvite(i.inviterName, i.eventTitle, () => this.openInvite(i));
    }
  }

  openInvite(inv: EventInvite) {
    this.router.navigate(['/activite', inv.eventId]).then(() => this.closeNotifDropdown());
  }

  viewInvite(inv: EventInvite) {
    if (!inv?.eventId) return;
    this.router.navigate(['/activite', inv.eventId]).then(() => this.closeNotifDropdown());
  }

  acceptInvite(inv: any) {
    // à adapter à ton endpoint d’acceptation (ou simplement “rejoindre l’événement”)
    this.eventService.participate(inv.eventId).subscribe({
      next: () => {
        this.notificationService.success('Invitation acceptée 👍');
        this.removeInviteFromList(inv);
        this.router.navigate(['/events', inv.eventId], { queryParams: { focus: 'chat' } });
      },
      error: () => this.notificationService.error("Impossible d'accepter l’invitation")
    });
  }

  dismissInvite(inv: any) {
    // si tu as un endpoint de dismiss, appelle-le ici
    this.removeInviteFromList(inv);
    this.notificationService.info('Invitation ignorée');
  }

  private removeInviteFromList(inv: any) {
    this.invites = (this.invites || []).filter((x: any) => x.id !== inv.id);
    this.notificationCount = Math.max(0, (this.notificationCount || 0) - 1);
  }

  private toastKey(userId: number) { return `inv:toast:${userId}`; }

  private loadToastSeen(userId: number) {
    try {
      const raw = localStorage.getItem(this.toastKey(userId));
      this.notifiedInviteIds = new Set(raw ? JSON.parse(raw) as number[] : []);
    } catch { this.notifiedInviteIds.clear(); }
  }

  private saveToastSeen() {
    if (!this.user) return;
    try {
      localStorage.setItem(this.toastKey(this.user.id), JSON.stringify([...this.notifiedInviteIds]));
    } catch {}
  }

  closeNotifDropdown() {
    document.getElementById('notifDropdown')?.click(); // ferme le menu
  }

}
