import { Component } from '@angular/core';
import jwt_decode from 'jwt-decode';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-mon-profil',
  templateUrl: './mon-profil.component.html',
  styleUrls: ['./mon-profil.component.css']
})
export class MonProfilComponent {

  user: any = null;

    constructor(private authService: AuthService) {}

  ngOnInit(): void {
    const token = this.authService.getToken();
    if (token) {
      try {
        const decoded: any = jwt_decode(token);
        this.user = decoded;
      } catch (err) {
        console.error("Erreur décodage token :", err);
      }
    }
  }

  logout(): void {
    this.authService.logout();
  }

  changePassword(): void {
    console.log("🔐 Changer le mot de passe cliqué !");
    // Tu peux ici ouvrir un modal, naviguer vers une page ou autre
  }

  confirmDelete(): void {
    const confirmation = confirm("Souhaites-tu vraiment supprimer ton compte ? Cette action est irréversible.");
    if (confirmation) {
      console.log("🗑️ Suppression du compte...");
      // Appelle ici le service de suppression :
      // this.userService.deleteMyAccount().subscribe(...)
    }
  }


}
