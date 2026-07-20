import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AdminRoutingModule } from './admin-routing.module';
import { AdminComponent } from './admin.component';
import { DriverManagementComponent } from './driver-management/driver-management.component';
import { TripManagementComponent } from './trip-management/trip-management.component';
import { ReportsComponent } from './reports/reports.component';
import { BillingAndPaymentComponent } from './billing-and-payment/billing-and-payment.component';
import { NotificationComponent } from './notification/notification.component';
import { ProfileComponent } from './profile/profile.component';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AdminSettingsComponent } from './admin-settings/admin-settings.component';


@NgModule({
  declarations: [
    AdminComponent,
    DriverManagementComponent,
    TripManagementComponent,
    ReportsComponent,
    BillingAndPaymentComponent,
    NotificationComponent,
    ProfileComponent,
    AdminDashboardComponent,
    AdminSettingsComponent,
  ],
  imports: [
    CommonModule,
    AdminRoutingModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class AdminModule { }
