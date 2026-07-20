import { Injectable } from '@angular/core';
import {
  CanActivate,
  CanActivateChild,
  Router
} from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate, CanActivateChild {

  constructor(private router: Router) {}

  private isAuthenticated(): boolean {
    const token = localStorage.getItem('authToken'); 
    // change key if using another token name

    if (token) {
      return true;
    }

    this.router.navigate(['/']);
    return false;
  }

  canActivate(): boolean {
    return this.isAuthenticated();
  }

  canActivateChild(): boolean {
    return this.isAuthenticated();
  }
}