import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoaderService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private requestCount = 0;

  get isLoading$(): Observable<boolean> {
    return this.loadingSubject.asObservable();
  }

  show(): void {
    this.requestCount++;
    this.loadingSubject.next(true);
  }

  hide(): void {
    this.requestCount = Math.max(this.requestCount - 1, 0);
    if (this.requestCount === 0) {
      this.loadingSubject.next(false);
    }
  }
}
