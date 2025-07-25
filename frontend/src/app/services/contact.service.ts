import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ContactService {
    private API_URL = 'http://localhost:8080/api';
  constructor(private http: HttpClient) {}

  getMyContacts(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/users/contacts`);
  }
}
