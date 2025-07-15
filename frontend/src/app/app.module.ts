
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { AppComponent } from './app.component';
import { EventListComponent } from './event-list/event-list.component';
import { EventFormComponent } from './event-form-component/app/event-form/event-form.component';
import { FormsModule } from '@angular/forms';
import { LoginComponent } from './login.component';
import { AppRoutingModule } from './app-routing.module';
import { NavbarComponent } from './navbar/navbar.component';
import { SignupComponent } from './signup/signup.component';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmModalComponent } from './confirm-modal/confirm-modal.component';

@NgModule({
  declarations: [EventFormComponent, AppComponent, EventListComponent, LoginComponent, NavbarComponent, SignupComponent, ConfirmModalComponent],
  imports: [BrowserModule, HttpClientModule, FormsModule, AppRoutingModule, NgbModule],
  providers: [  {
    provide: HTTP_INTERCEPTORS,
    useClass: AuthInterceptor,
    multi: true
  }],
  bootstrap: [AppComponent]
})
export class AppModule {}
