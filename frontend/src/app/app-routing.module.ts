import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EventListComponent } from './event-list/event-list.component';
import { AuthGuard } from './auth.guard';
import { LoginComponent } from './login.component';
import { SignupComponent } from './signup/signup.component';
import { EventFormComponent } from './event-form-component/app/event-form/event-form.component';
import { GroupCreateComponent } from './group-create/group-create.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';

const routes: Routes = [
  { path: '', component: EventListComponent }, // Page d'accueil avec filtres
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'create-group', component: GroupCreateComponent },
  { path: 'create-event', component: EventFormComponent },
  {
    path: 'forgot-password',
    component: ForgotPasswordComponent
  },
  // Redirection pour toute autre URL
  { path: '**', redirectTo: '', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { onSameUrlNavigation: 'reload' })],
  exports: [RouterModule]
})
export class AppRoutingModule {}
