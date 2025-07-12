import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EventListComponent } from './event-list/event-list.component';
import { AuthGuard } from './auth.guard';
import { LoginComponent } from './login.component';
import { SignupComponent } from './signup/signup.component';

const routes: Routes = [
  { path: 'events', component: EventListComponent, canActivate: [AuthGuard] },
  { path: 'login', component: LoginComponent },
  { path: '', redirectTo: 'events', pathMatch: 'full' },
  { path: 'signup', component: SignupComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
