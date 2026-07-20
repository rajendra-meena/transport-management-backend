import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DriverComponent } from './driver.component';
import { MyTripComponent } from './my-trip/my-trip.component';
import { MyEarningsComponent } from './my-earnings/my-earnings.component';
import { AuthGuard } from '../guards/auth.guard';


const routes: Routes = [{
  path: '', component: DriverComponent,
  canActivateChild: [AuthGuard],
  children: [
    {
      path: '', redirectTo: 'my_trips', pathMatch: 'full'
    },
    {
      path: 'my_trips',
      component: MyTripComponent
    },
    {
      path: 'my_earnings',
      component: MyEarningsComponent
    },
  ]

}];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DriverRoutingModule { }
