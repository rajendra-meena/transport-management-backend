import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { AdminService } from 'src/app/service/admin/admin.service';

@Component({
  selector: 'app-admin-settings',
  templateUrl: './admin-settings.component.html',
  styleUrls: ['./admin-settings.component.scss']
})
export class AdminSettingsComponent implements OnInit {

 fareForm!: FormGroup;

constructor(
  private fb: FormBuilder,
  private api: AdminService
) {}

ngOnInit() {

  this.fareForm = this.fb.group({
   baseFare:[0],

perKmRate:[0],

commissionRate:[0]
  });

  this.getFareConfig();
}

getFareConfig() {
  this.api.getFareConfig().subscribe((res: any) => {

    this.fareForm.patchValue({
      baseFare: res.data.baseFare,
      perKmRate: res.data.perKmRate,
      commissionRate: res.data.commissionRate
    });

  });
}

  alerts: { type: 'success' | 'error'; message: string }[] = [];

  showAlert(type: 'success' | 'error', message: string) {
    const alert = { type, message };
    this.alerts.push(alert);

    setTimeout(() => {
      this.alerts = this.alerts.filter(a => a !== alert);
    }, 3000);
  }

  removeAlert(alert: any) {
    this.alerts = this.alerts.filter(a => a !== alert);
  }

updateFare() {

  if (this.fareForm.invalid) {
    this.showAlert(
      'error',
      'Please fill all required fields'
    );
    return;
  }

  this.api
    .updateFareConfig(this.fareForm.value)
    .subscribe({

      next: () => {

        this.showAlert(
          'success',
          'Fare configuration updated successfully'
        );

      },

      error: (err) => {

        this.showAlert(
          'error',
          err?.error?.message ||
          'Failed to update fare configuration'
        );

      }

    });

}

}
