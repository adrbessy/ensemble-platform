import { Component } from '@angular/core';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html'
})
export class ForgotPasswordComponent {
  email = '';
  successMessage = '';
  errorMessage = '';

  sendResetLink(): void {
    if (!this.email) {
      this.errorMessage = 'Veuillez entrer votre email.';
      this.successMessage = '';
      return;
    }

    if (!this.isValidEmail(this.email)) {
      this.errorMessage = 'Adresse email invalide.';
      return;
    }

    // Simule une requête
    this.successMessage = 'Un lien de réinitialisation a été envoyé.';
    this.errorMessage = '';
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
