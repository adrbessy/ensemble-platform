import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { environment } from 'src/environments/environment'; 
import { EventInvite } from '../models/event-invite.model';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  constructor(private toastr: ToastrService, private http: HttpClient) {}

  success(message: string, title: string = 'Succès') {
    this.toastr.success(message, title);
  }

  error(message: string, title: string = 'Erreur') {
    this.toastr.error(message, title);
  }

  warn(message: string, title: string = 'Attention') {
    this.toastr.warning(message, title);
  }

  info(message: string, title: string = 'Info') {
    this.toastr.info(message, title);
  }

  friendRequest(fromName: string, onTap?: () => void) {
    const ref = this.toastr.info(
      `${fromName} t’a envoyé une demande d’ami`,
      'Nouvelle demande',
      { timeOut: 7000 }
    );
    if (onTap) {
      ref.onTap.subscribe(() => onTap());
    }
  }

  eventInvite(inviter: string, title: string, onTap?: () => void) {
    const ref = this.toastr.info(
      `${inviter} t’a invité à « ${title} »`,
      'Nouvelle invitation',
      { timeOut: 7000 }
    );
    if (onTap) ref.onTap.subscribe(() => onTap());
  }

  getCount() {
    return this.http.get<{count:number}>(`${environment.apiUrl}/me/notifications/count`);
  }
  markAllRead() {
    return this.http.post<void>(`${environment.apiUrl}/me/notifications/mark-read`, {});
  }
  getInvites() {
    return this.http.get<EventInvite[]>(`${environment.apiUrl}/me/notifications/invites`);
  }


}
