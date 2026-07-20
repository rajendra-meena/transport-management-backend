import { Component } from '@angular/core';
import { AdminService } from '../service/admin/admin.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { FcmService } from '../service/fcm.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private adminService: AdminService,
    private route: Router,
    private fcmService: FcmService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(3)]]
    });
  }

login() {
  if (this.loginForm.invalid) {
    this.loginForm.markAllAsTouched();
    return;
  }

  this.isLoading = true;
  this.errorMessage = '';

  this.adminService.login(this.loginForm.value).subscribe({
    next: (res: any) => {
      this.isLoading = false;

      const token = res?.token;
      const role = res?.role;

      // Save auth data
      if (token) {
        localStorage.setItem('authToken', token);
      }

      if (role) {
        localStorage.setItem('role', role);
      }

      // Register FCM device token
      this.fcmService.requestPermissionAndGetToken();

      // Redirect based on role
      switch (role) {
        case 'admin':
          this.route.navigate(['/admin']);
          break;

        case 'driver':
          this.route.navigate(['/driver']);
          break;

        default:
          this.route.navigate(['/']);
      }
    },

    error: (err) => {
      this.isLoading = false;
      this.errorMessage =
        err?.error?.message || 'Login failed';
    }
  });
}



}
