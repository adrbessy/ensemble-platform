import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent {
  firstName = '';
  lastName = '';
  email = '';
  password = '';
  confirmPassword = '';
  birthdate: string = '';
  gender: string = '';
  photoFile: File | null = null;
  acceptCGU = false;

  errorMessage = '';
  successMessage = '';
  loading = false;

  photoPreview: SafeUrl | null = null;

  today = new Date().toISOString().split('T')[0];

  photoError: boolean = false;

  constructor(private authService: AuthService, public router: Router, private sanitizer: DomSanitizer) {}

  ngOnInit(): void {
    this.today = new Date().toISOString().split('T')[0];

    const defaultBirth = new Date();
    defaultBirth.setFullYear(defaultBirth.getFullYear() - 25); // -25 ans
    defaultBirth.setMonth(0); // janvier
    defaultBirth.setDate(1);  // jour 1

    this.birthdate = defaultBirth.toISOString().split('T')[0];
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.photoFile = input.files[0];
      this.photoPreview = this.sanitizer.bypassSecurityTrustUrl(URL.createObjectURL(this.photoFile));
      this.photoError = false;
      console.log('Fichier sélectionné :', this.photoFile);
      console.log('Aperçu généré :', this.photoPreview);
    }
  }

  register(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.photoFile) {
      this.photoError = true;
      this.errorMessage = 'La photo est obligatoire.';
      return;
    }

    if (!this.firstName.trim()) {
      this.errorMessage = 'Le prénom est obligatoire.';
      return;
    }

    if (!this.lastName.trim()) {
      this.errorMessage = 'Le nom est obligatoire.';
      return;
    }

    if (!this.email.trim()) {
      this.errorMessage = 'L\'email est obligatoire.';
      return;
    }

    if (!this.isValidEmail(this.email)) {
      this.errorMessage = 'Adresse email invalide.';
      return;
    }

    if (!this.password.trim()) {
      this.errorMessage = 'Le mot de passe est obligatoire.';
      return;
    }

    if (this.password.length < 8) {
      this.errorMessage = 'Le mot de passe doit contenir au moins 8 caractères.';
      return;
    }

    if (!this.confirmPassword.trim()) {
      this.errorMessage = 'La confirmation du mot de passe est obligatoire.';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Les mots de passe ne correspondent pas.';
      return;
    }

    if (!this.birthdate) {
      this.errorMessage = 'La date de naissance est obligatoire.';
      return;
    }

    const today = new Date();
    const birthDate = new Date(this.birthdate);

    if (birthDate > today) {
      this.errorMessage = "La date de naissance ne peut pas être dans le futur.";
      return;
    }

    const age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    const dayDiff = today.getDate() - birthDate.getDate();

    if (age < 13 || (age === 13 && (m < 0 || (m === 0 && dayDiff < 0)))) {
      this.errorMessage = 'Vous devez avoir au moins 13 ans pour vous inscrire.';
      return;
    }

    if (!this.gender) {
      this.errorMessage = "Le sexe est obligatoire.";
      return;
    }

    if (!this.acceptCGU) {
      this.errorMessage = 'Vous devez accepter les CGU.';
      return;
    }

    const formData = new FormData();
    formData.append('firstName', this.firstName);
    formData.append('lastName', this.lastName);
    formData.append('email', this.email);
    formData.append('password', this.password);
    formData.append('birthdate', this.birthdate);
    formData.append('gender', this.gender);
    formData.append('photo', this.photoFile);

    this.loading = true;

    this.authService.register(formData).subscribe({
      next: (response) => {
        this.successMessage = 'Inscription réussie !';
        this.loading = false;
        console.log('Redirection vers /login...');
        this.router.navigate(['/login']); // ✅ direct
      },
      error: (err) => {
        console.error('Erreur backend:', err);
        this.errorMessage = err.error?.message || 'Erreur lors de l\'inscription.';
        this.loading = false;
      }
    });
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
