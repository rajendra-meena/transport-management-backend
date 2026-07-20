import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminComponent } from './admin.component';
import { DriverManagementComponent } from './driver-management/driver-management.component';
import { BillingAndPaymentComponent } from './billing-and-payment/billing-and-payment.component';
import { TripManagementComponent } from './trip-management/trip-management.component';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';
import { NotificationComponent } from './notification/notification.component';
import { ProfileComponent } from './profile/profile.component';
import { ReportsComponent } from './reports/reports.component';
import { AdminSettingsComponent } from './admin-settings/admin-settings.component';
import { AuthGuard } from '../guards/auth.guard';


const routes: Routes = [{ path: '', component: AdminComponent,  canActivateChild: [AuthGuard],

  children:[
    {
      path:'',redirectTo:'admin_dashboard',pathMatch:'full'
    },
    {
      path:'driver_management',
      component:DriverManagementComponent
    },
    {
      path:'billing_payment',
      component:BillingAndPaymentComponent
    },
    {
      path:'trip_management',
      component:TripManagementComponent
    },
    {
      path:'admin_dashboard',
      component:AdminDashboardComponent
    },
    {
      path:'notification',
      component:NotificationComponent
    },
    {
      path:'profile',
      component:ProfileComponent
    },
    {
      path:'reports',
      component:ReportsComponent
    },
    {
      path:'settings',
      component:AdminSettingsComponent
    }
  ]

 }

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
