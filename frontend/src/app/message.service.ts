import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  private messageSubject = new BehaviorSubject<string | null>(null);
  message$ = this.messageSubject.asObservable();

  showMessage(message: string): void {
    this.messageSubject.next(message);
    setTimeout(() => this.clearMessage(), 3000); // disparaît après 3 secondes
  }

  clearMessage(): void {
    this.messageSubject.next(null);
  }
}
