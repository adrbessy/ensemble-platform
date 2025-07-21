import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

export interface CreateGroupRequest {
  name: string;
  private: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class GroupService {
  private apiUrl = '/groups';
  private API_URL = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}

  createGroup(data: CreateGroupRequest) {
    return this.http.post(this.apiUrl, data);
  }

  getMyGroups() {
    return this.http.get<any[]>(`${this.API_URL}/groups/mine`);
  }

}
