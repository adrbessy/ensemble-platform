// src/app/services/user.service.ts
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { User } from '../models/user.model';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';


@Injectable({ providedIn: 'root' })
export class UserService {
  constructor(private http: HttpClient) {}

  // Stockage central de l'utilisateur
    private userSubject = new BehaviorSubject<User | null>(null);
    user$ = this.userSubject.asObservable();

    setUser(user: User) {
    this.userSubject.next(user);
    }

    getUser(): User | null {
    return this.userSubject.getValue();
    }


  deleteMyAccount() {
    return this.http.delete('/api/users/me');
  }

    addFriendByCode(code: string) {
        return this.http.post('/api/users/add-friend', { friendCode: code });
    }


    getMyProfile(): Observable<User> {
        return this.http.get<User>('/api/users/me');
    }

    generateFriendCode() {
        return this.http.post<any>('/api/users/generate-friend-code', {});
    }

    sendFriendRequest(code: string) {
        return this.http.post('/api/users/send-friend-request', { friendCode: code });
    }

    getFriendRequests() {
    return this.http.get<any[]>('/api/users/friend-requests');
    }

    acceptFriendRequest(requestId: number) {
    return this.http.post('/api/users/accept-friend-request', { requestId });
    }

    deleteFriendRequest(requestId: number) {
    return this.http.delete(`/api/users/friend-request/${requestId}`);
    }

    updateMyProfile(data: any) {
        return this.http.put<User>('/api/users/me', data);
    }

    uploadProfilePhoto(file: FormData) {
    return this.http.post<User>('/api/users/upload-photo', file).pipe(
        tap((updatedUser) => this.setUser(updatedUser))
    );
    }



}
