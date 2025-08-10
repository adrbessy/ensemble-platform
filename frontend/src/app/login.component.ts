import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { MessageService } from './message.service';
import { environment } from 'src/environments/environment';
import { NotificationService } from './services/notification.service';
import { AuthService } from './auth.service';
import { UserService } from './services/user.service';
import { ChatService } from './services/chat.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html'
})
export class LoginComponent {
  email = '';
  password = '';
  errorMessage: string = ''; 

  constructor(private http: HttpClient, private router: Router, private notificationService: NotificationService, 
    private authService: AuthService,
  private userService: UserService,
private chatService: ChatService) {}

login() {
  if (!this.email || !this.password) {
    this.errorMessage = "Veuillez remplir tous les champs.";
    return;
  }

  this.errorMessage = '';
  const credentials = {
    email: this.email,
    password: this.password
  };

  this.http.post<any>(`${environment.apiUrl}/auth/login`, credentials)
    .subscribe({
      next: (response) => {
        localStorage.setItem('token', response.token);
        this.authService.setLoggedIn(true);

        // ✅ Charger et propager le profil utilisateur actuel
        this.authService.getDecodedToken(); // met à jour this.currentUser dans AuthService
        this.authService.setLoggedIn(true);

        // 👉 maintenant on recharge le user depuis le backend
        this.http.get<any>(`${environment.apiUrl}/users/me`).subscribe({
          next: (user) => {
            this.authService.setLoggedIn(true); // Redondant mais safe
            this.notificationService.success("Connexion réussie");

            this.userService.setUser(user); // 🔁 met à jour le user global

            // ✅ Ajout pour charger les messages après login
            this.chatService.getConversations().subscribe(convs => {
              const hasUnread = convs.some(conv => {
                const lastMsg = conv.lastMessage;
                return lastMsg?.sender.id !== user.id;
              });

              if (hasUnread) {
                convs.forEach(c => {
                  if (c.lastMessage?.sender.id !== user.id) {
                    this.chatService.notifyUnreadForConversation(c.id);
                  }
                });
              }
            });

            this.router.navigate(['/events']);
          },
          error: () => {
            this.notificationService.error("Impossible de récupérer les informations du profil.");
            this.router.navigate(['/events']);
          }
        });
      },
      error: (err) => {
        this.errorMessage = "Email ou mot de passe incorrect.";
        console.error('Erreur de connexion', err);
      }
    });
}

}
