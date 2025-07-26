
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
import { GroupCreateComponent } from './group-create/group-create.component';
import { RouterModule } from '@angular/router';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { LOCALE_ID } from '@angular/core';
import { NgbDateParserFormatter } from '@ng-bootstrap/ng-bootstrap';
import { CustomDateParserFormatter } from './utils/custom-date-parser-formatter';
import { AutoResizeDirective } from './directives/auto-resize.directive';


registerLocaleData(localeFr);

@NgModule({
  declarations: [EventFormComponent, AppComponent, EventListComponent, LoginComponent, NavbarComponent, SignupComponent, ConfirmModalComponent, LoaderComponent, GroupCreateComponent, ForgotPasswordComponent,
    AutoResizeDirective
  ],

  imports: [RouterModule, BrowserAnimationsModule, // OBLIGATOIRE pour ngx-toastr
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
  },
  { provide: LOCALE_ID, useValue: 'fr-FR' },
  { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter }],
  bootstrap: [AppComponent],
  
})
export class AppModule {}
