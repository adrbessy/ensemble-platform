import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EventListComponent } from './event-list/event-list.component';
import { AuthGuard } from './auth.guard';
import { LoginComponent } from './login.component';
import { SignupComponent } from './signup/signup.component';
import { EventFormComponent } from './event-form-component/app/event-form/event-form.component';

const routes: Routes = [
  { path: '', component: EventListComponent }, // Page d'accueil avec filtres
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'create-event', component: EventFormComponent },
  // Redirection pour toute autre URL
  { path: '**', redirectTo: '', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
