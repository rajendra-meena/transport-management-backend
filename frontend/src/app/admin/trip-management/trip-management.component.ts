import { Component, OnInit } from '@angular/core';
import { AdminService } from 'src/app/service/admin/admin.service';

@Component({
  selector: 'app-trip-management',
  templateUrl: './trip-management.component.html',
  styleUrls: ['./trip-management.component.scss']
})
export class TripManagementComponent implements OnInit {

  constructor(private adminService: AdminService) { }

  newTrip: any = {
    pickupLocation: '',
    dropLocation: '',
    customerName: '',
    customerPhone: ''
  };

  selectedTripId: string = '';

editTripData: any = {
  pickupLocation: '',
  dropLocation: '',
  customerName: '',
  customerPhone: ''
};

  addTrip() {
    this.adminService.addTrip(this.newTrip).subscribe({
      next: () => {
        this.showAlert('success', 'Trip created successfully');

        // reset form
        this.newTrip = {
          pickupLocation: '',
          dropLocation: '',
          customerName: '',
          customerPhone: ''
        };

        // close modal
        const modalEl = document.getElementById('addTripModal');
        const modal = (window as any).bootstrap.Modal.getInstance(modalEl);
        modal.hide();

        // optional: refresh trips list
        // this.getTrips();
      },
      error: (err) => {
        console.log(err.error);
        this.showAlert('error', 'Failed to create trip');
      }
    });
  }

  openEditTripModal(trip: any) {
  this.selectedTripId = trip._id;

  this.editTripData = {
    pickupLocation: trip.pickupLocation,
    dropLocation: trip.dropLocation,
    customerName: trip.customerName,
    customerPhone: trip.customerPhone
  };

  const modalEl = document.getElementById('editTripModal');
  const modal = new (window as any).bootstrap.Modal(modalEl);
  modal.show();
}

updateTrip() {
  this.adminService.updateTrip(this.selectedTripId, this.editTripData).subscribe({
    next: () => {
      this.showAlert('success', 'Trip updated successfully');

      // update UI instantly
      const trip = this.trips.find(t => t._id === this.selectedTripId);
      if (trip) {
        Object.assign(trip, this.editTripData);
      }

      const modalEl = document.getElementById('editTripModal');
      const modal = (window as any).bootstrap.Modal.getInstance(modalEl);
      modal.hide();
    },
    error: () => {
      this.showAlert('error', 'Failed to update trip');
    }
  });
}

deleteTripId: string = '';
deleteTripName: string = '';

openDeleteTripModal(trip: any) {
  this.deleteTripId = trip._id;

  // show route instead of just id (better UX)
  this.deleteTripName = `${trip.pickupLocation} → ${trip.dropLocation}`;

  const modalEl = document.getElementById('deleteTripModal');
  const modal = new (window as any).bootstrap.Modal(modalEl);
  modal.show();
}

confirmDeleteTrip() {
  this.adminService.deleteTrip(this.deleteTripId).subscribe({
    next: () => {
      this.showAlert('success', 'Trip deleted successfully');

      // remove from UI instantly
      this.trips = this.trips.filter(t => t._id !== this.deleteTripId);
      this.filteredTrips = this.filteredTrips.filter(t => t._id !== this.deleteTripId);

      const modalEl = document.getElementById('deleteTripModal');
      const modal = (window as any).bootstrap.Modal.getInstance(modalEl);
      modal.hide();
    },
    error: () => {
      this.showAlert('error', 'Failed to delete trip');
    }
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


  trips: any[] = [];
  filteredTrips: any[] = [];
  searchText: string = '';

  ngOnInit() {
    this.getTrips();
    this.getDrivers();
  }

  getTrips() {
    this.adminService.getTrips().subscribe({
      next: (res: any) => {
        this.trips = res.data || [];
        this.filteredTrips = [...this.trips];
      },
      error: (err) => console.error(err)
    });
  }

  // 🔍 Search
  searchTrips() {
    const text = this.searchText.toLowerCase();

    this.filteredTrips = this.trips.filter(trip =>
      trip.pickupLocation.toLowerCase().includes(text) ||
      trip.dropLocation.toLowerCase().includes(text) ||
      trip.customerName.toLowerCase().includes(text) ||
      trip.customerPhone.includes(text) ||
      (trip.status || '').toLowerCase().includes(text) ||
      (trip.driverId?.name || '').toLowerCase().includes(text)
    );
  }

  drivers: any[] = [];

  getDrivers() {
    this.adminService.getAllDrivers().subscribe({
      next: (res: any) => {
        this.drivers = res.data;
      }
    });
  }

  assignDriver(trip: any) {
  if (!trip.selectedDriver) return;

  this.adminService.assignDriver(trip._id, trip.selectedDriver, trip.distance).subscribe({
    next: () => {
      this.showAlert('success', 'Driver assigned successfully');

      const driver = this.drivers.find(d => d._id === trip.selectedDriver);
      trip.driverId = driver;

    },
    error: () => {
      this.showAlert('error', 'Failed to assign driver');
    }
  });
}

}
