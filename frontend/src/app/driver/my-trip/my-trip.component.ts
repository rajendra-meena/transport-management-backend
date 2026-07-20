import { NgClass } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { DriverService } from 'src/app/service/driver/driver.service';

@Component({
  selector: 'app-my-trip',
  templateUrl: './my-trip.component.html',
  styleUrls: ['./my-trip.component.scss']
})
export class MyTripComponent implements OnInit {

  constructor(private api: DriverService) { }

  trips: any[] = [];

  ngOnInit() {
    this.getData();
  }

  getData() {
    this.api.getMyTrips().subscribe({
      next: (res: any) => {
        this.trips = res.data || [];
      },
      error: (err) => {
        console.log(err);
      }
    });
  }

  acceptTrip(id: string) {
    this.api.acceptTrip(id).subscribe({
      next: (res: any) => {
        console.log('Trip Accepted', res);

        // reload trips if needed
        this.getData();
      },
      error: (err) => {
        console.error(err);
      }
    });
  }

  tripAction(type: string, id: string) {

    let request;

    switch (type) {

      case 'accept':
        request = this.api.acceptTrip(id);
        break;

      case 'cancel':
        request = this.api.cancelTrip(id);
        break;

      case 'start':
        request = this.api.startTrip(id);
        break;

      case 'complete':
        request = this.api.completeTrip(id);
        break;

      default:
        return;
    }

    request.subscribe({
      next: () => {
        this.getData();
      },
      error: (err) => {
        console.log(err);
      }
    });
  }

}
