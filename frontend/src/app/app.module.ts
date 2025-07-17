
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
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ToastrModule } from 'ngx-toastr';
import { LoaderInterceptor } from './interceptors/loader.interceptor';
import { LoaderComponent } from './loader/loader.component';

@NgModule({
  declarations: [EventFormComponent, AppComponent, EventListComponent, LoginComponent, NavbarComponent, SignupComponent, ConfirmModalComponent, LoaderComponent],
  imports: [BrowserAnimationsModule, // OBLIGATOIRE pour ngx-toastr
    ToastrModule.forRoot({
      positionClass: 'toast-bottom-right',
      preventDuplicates: true,
      timeOut: 3000
    }),
    BrowserModule, HttpClientModule, FormsModule, AppRoutingModule, NgbModule],
  providers: [  {
    provide: HTTP_INTERCEPTORS,
    useClass: AuthInterceptor,
    multi: true
  },
  {
    provide: HTTP_INTERCEPTORS,
    useClass: LoaderInterceptor,
    multi: true
  }],
  bootstrap: [AppComponent]
})
export class AppModule {}
