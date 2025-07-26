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
  prenomError: boolean = false;
  nomError: boolean = false;
  emailError: boolean = false;
  emailInvalidError: boolean = false;
  passwordError: boolean = false;
  passwordTooShortError: boolean = false;
  confirmPasswordError: boolean = false;
  neCorrespondPasError: boolean = false;
  birthdateError: boolean = false;
  birthdateFutureError: boolean = false;
  birthdateTooYoungError: boolean = false;
  genderError: boolean = false;
  acceptCGUError: boolean = false;

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

  onPrenomChange(): void {
    if (this.firstName && this.firstName.trim().length > 0) {
      this.prenomError = false;
    }
  }

  onNomChange(): void {
    if (this.lastName && this.lastName.trim().length > 0) {
      this.nomError = false;
    }
  }
  onEmailChange(): void {
    if (this.email && this.email.trim().length > 0) {
      this.emailError = false;
    }
    if (this.isValidEmail(this.email)) {
      this.emailInvalidError = false;
    }
  }
  onPasswordChange(): void {
    if (this.password && this.password.trim().length > 0) {
      this.passwordError = false;
    }
    if (this.password.length < 8) {
      this.passwordTooShortError = true;
    } else {
      this.passwordTooShortError = false;
    }
  }
  onConfirmPasswordChange(): void {
    if (this.confirmPassword && this.confirmPassword.trim().length > 0) {
      this.confirmPasswordError = false;
    }
    if (this.password !== this.confirmPassword) {
      this.neCorrespondPasError = true;
    } else {
      this.neCorrespondPasError = false;
    }
  }

  onBirthdateChange(): void {
    if (this.birthdate) {
      this.birthdateError = false;
    }
    const today = new Date();
    const birthDate = new Date(this.birthdate);
    if (birthDate > today) {
      this.birthdateFutureError = true;
    } else {
      this.birthdateFutureError = false;
    }
    const age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    const dayDiff = today.getDate() - birthDate.getDate();
    if (age < 16 || (age === 16 && (m < 0 || (m === 0 && dayDiff < 0)))) {
      this.birthdateTooYoungError = true;
    } else {
      this.birthdateTooYoungError = false;
    }
  }

  onGenderChange(): void {
    if (this.gender) {
      this.genderError = false;
    }
  }

  onAcceptCGUChange(): void {
    if (this.acceptCGU) {
      this.acceptCGUError = false;
    }
  }

  register(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.photoFile) {
      this.photoError = true;
      return;
    }

    if (!this.firstName.trim()) {
      this.prenomError = true;
      return;
    }

    if (!this.lastName.trim()) {
      this.nomError = true;
      return;
    }

    if (!this.email.trim()) {
      this.emailError = true;
      return;
    }

    if (!this.isValidEmail(this.email)) {
      this.emailInvalidError = true;
      return;
    }

    if (!this.password.trim()) {
      this.passwordError = true;
      return;
    }

    if (this.password.length < 8) {
      this.passwordTooShortError = true;
      return;
    }

    if (!this.confirmPassword.trim()) {
      this.confirmPasswordError = true;
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.neCorrespondPasError = true;
      return;
    }

    if (!this.birthdate) {
      this.birthdateError = true;
      return;
    }

    const today = new Date();
    const birthDate = new Date(this.birthdate);

    if (birthDate > today) {
      this.birthdateFutureError = true;
      return;
    }

    const age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    const dayDiff = today.getDate() - birthDate.getDate();

    if (age < 16 || (age === 16 && (m < 0 || (m === 0 && dayDiff < 0)))) {
      this.birthdateTooYoungError = true;
      return;
    }

    if (!this.gender) {
      this.genderError = true;
      return;
    }

    if (!this.acceptCGU) {
      this.acceptCGUError = true;
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
