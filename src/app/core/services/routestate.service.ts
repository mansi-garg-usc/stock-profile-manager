import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

interface RouteState {
  data: any; // Structure this based on the data you need to save
}

@Injectable({
  providedIn: 'root',
})
export class RouteStateService {
  private routeState = new BehaviorSubject<RouteState | null>(null);

  setRouteState(state: RouteState): void {
    this.routeState.next(state);
  }

  getRouteState() {
    return this.routeState.asObservable();
  }
}
