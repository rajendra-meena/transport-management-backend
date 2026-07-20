import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DriverRoutingModule } from './driver-routing.module';
import { DriverComponent } from './driver.component';
import { MyTripComponent } from './my-trip/my-trip.component';
import { MyEarningsComponent } from './my-earnings/my-earnings.component';


@NgModule({
  declarations: [
    DriverComponent,
    MyTripComponent,
    MyEarningsComponent
  ],
  imports: [
    CommonModule,
    DriverRoutingModule
  ]
})
export class DriverModule { }
