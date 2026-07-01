import { Component } from '@angular/core';
import jwt_decode from 'jwt-decode';
import { AuthService } from '../auth.service';
import { UserService } from '../services/user.service';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FriendsModalComponent } from '../friends-modal/friends-modal.component';
import { ActivatedRoute } from '@angular/router';
import { ElementRef, ViewChild } from '@angular/core';

@Component({
  selector: 'app-mon-profil',
  templateUrl: './mon-profil.component.html',
  styleUrls: ['./mon-profil.component.css']
})
export class MonProfilComponent {
  @ViewChild('requestsSection') requestsSection!: ElementRef<HTMLDivElement>;

  user: any = null;
  edit = {
    birthdate: false,
    gender: false,
    firstName: false,
    lastName: false
  };
  pulseRequests = false;
  friendRequests: any[] = [];
  sentFriendRequests: any[] = [];

  constructor(private authService: AuthService,  
    private userService: UserService, 
    private router: Router,
    private modalService: NgbModal,
    private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.loadProfile();
    this.loadFriendRequests();
    this.loadSentFriendRequests(); 

    this.route.queryParamMap.subscribe(params => {
      const focus = params.get('focus');
      if (focus === 'requests') {
        // S’assurer que la liste est chargée, puis scroller
        setTimeout(() => {
          if (this.requestsSection) {
            this.requestsSection?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            this.pulseRequests = true;
            setTimeout(() => this.pulseRequests = false, 1500);
          }
        }, 100);
      }
    });
    
    this.userService.getMyProfile().subscribe(console.log);
    this.userService.getMyProfile().subscribe({
      next: (data) => {
        this.user = data;
      },
      error: (err) => {
        console.error("Erreur chargement profil :", err);
      }
    });
  }

  loadSentFriendRequests() {
    this.userService.getSentFriendRequests().subscribe({
      next: reqs => this.sentFriendRequests = (reqs || []).filter(r => !r.accepted),
      error: e => console.error('Err sent FR', e)
    });
  }

  generateFriendCode() {
  this.userService.generateFriendCode().subscribe({
    next: (res: any) => {
      this.user.friendCode = res.code;
      alert("Code généré : " + res.code);
    },
    error: (err) => {
      console.error("Erreur génération code :", err);
    }
  });
}

  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      alert("Code copié !");
    });
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
    if (!confirmation) return;

    this.userService.deleteMyAccount().subscribe({
      next: () => {
        console.log("🗑️ Compte supprimé !");
        this.authService.logout(); // Supprime le token
        this.router.navigate(['/login']); // Redirige vers la page de connexion
      },
      error: err => {
        console.error("Erreur suppression compte :", err);
        alert("Une erreur est survenue lors de la suppression.");
      }
    });
  }

  friendCode = "";
  friendAddedMessage = "";

  // après envoi, rafraîchir la liste envoyée
  ajouterAmi() {
    if (!this.friendCode.trim()) return;
    this.userService.sendFriendRequest(this.friendCode.trim()).subscribe({
      next: res => {
        this.friendAddedMessage = res.message || '✅ Demande envoyée !';
        this.friendCode = '';
        this.loadSentFriendRequests();        // ⬅️
      },
      error: err => {
        console.error('Erreur demande ami :', err);
        this.friendAddedMessage = err.error?.error || '❌ Erreur lors de la demande.';
      }
    });
  }

  annulerDemandeEnvoyee(id: number) {
    this.userService.cancelSentFriendRequest(id).subscribe({
      next: () => this.loadSentFriendRequests()
    });
  }

  loadProfile() {
    this.userService.getMyProfile().subscribe({
      next: (data) => {
        this.user = data;
        this.userService.setUser(data); // ← Ajoute ceci si tu veux synchroniser globalement
      },
      error: (err) => console.error("Erreur chargement profil :", err)
    });
  }


  pendingFriendRequests: any[] = [];

  loadFriendRequests() {
    this.userService.getFriendRequests().subscribe({
      next: (requests) => {
        this.friendRequests = requests;
        this.pendingFriendRequests = requests.filter(r => !r.accepted); // ← ici
      },
      error: (err) => console.error("Erreur récupération demandes :", err)
    });
  }


  accepterDemande(id: number) {
    this.userService.acceptFriendRequest(id).subscribe({
      next: () => {
        this.loadProfile();       // Rafraîchit la liste d'amis
        this.loadFriendRequests(); // Enlève la demande de la liste
        this.authService.refreshCurrentUser();
      }
    });
  }

  refuserDemande(id: number) {
    this.userService.deleteFriendRequest(id).subscribe({
      next: () => {
        this.loadFriendRequests();
        this.authService.refreshCurrentUser();
      }
    });
  }

  hasPendingFriendRequests(): boolean {
    return this.friendRequests.some(r => !r.accepted);
  }

  save(champ: string) {
    if (!this.user) return;

    const payload: any = {};

    switch (champ) {
      case 'birthdate':
        payload.birthdate = this.user.birthdate;
        break;
      case 'gender':
        payload.gender = this.user.gender;
        break;
      case 'firstName':
        payload.firstName = this.user.firstName;
        break;
      case 'lastName':
        payload.lastName = this.user.lastName;
        break;
      default:
        return;
    }

    this.userService.updateMyProfile(payload).subscribe({
      next: (updatedUser) => {
        this.user = updatedUser;
        this.edit[champ] = false;
        console.log("✅ Profil mis à jour :", updatedUser);
      },
      error: (err) => {
        console.error("❌ Erreur mise à jour :", err);
        alert("Erreur lors de la mise à jour.");
      }
    });
  }

  selectedFile: File | null = null;

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  uploadPhoto() {
    if (!this.selectedFile) return;

    const formData = new FormData();
    formData.append('file', this.selectedFile);

    this.userService.uploadProfilePhoto(formData).subscribe({
      next: (res) => {
        console.log('✅ Photo mise à jour', res);
        this.loadProfile(); // Pour recharger l’image
        this.selectedFile = null;
      },
      error: (err) => {
        console.error("❌ Erreur upload :", err);
        alert("Erreur lors du téléchargement de la photo.");
      }
    });
  }

  openFriendsModal() {
    const ref = this.modalService.open(FriendsModalComponent, { size: 'md' });

    // ⚠️ charger les contacts complets (avec birthdate)
    this.userService.getContacts().subscribe(contacts => {
      ref.componentInstance.contacts = contacts;

      // garder ta mise à jour immédiate du profil quand on supprime
      ref.componentInstance.removed.subscribe((removedId: number) => {
        this.user.contacts = this.user.contacts.filter(c => c.id !== removedId);
        this.userService.setUser({ ...this.user });
      });
    });
  }


}
