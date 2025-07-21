import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html'
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

  constructor(private authService: AuthService, public router: Router, private sanitizer: DomSanitizer) {}

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.photoFile = input.files[0];
      this.photoPreview = this.sanitizer.bypassSecurityTrustUrl(URL.createObjectURL(this.photoFile));
      console.log('Fichier sélectionné :', this.photoFile);
      console.log('Aperçu généré :', this.photoPreview);
    }
  }

  register(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Les mots de passe ne correspondent pas.';
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

    if (this.photoFile) {
      formData.append('photo', this.photoFile);
    }

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
}
