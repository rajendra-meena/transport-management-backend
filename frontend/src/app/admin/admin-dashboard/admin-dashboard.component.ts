import { Component, OnInit } from '@angular/core';
import { AdminService } from 'src/app/service/admin/admin.service';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit {

  constructor(private adminService:AdminService){}

  totalTrips = 0;
totalDrivers = 0;
completedTrips = 0;
activeDrivers = 0;

recentTrips: any[] = [];

ngOnInit() {
  this.loadDashboard();
}

loadDashboard() {
  // get trips
  this.adminService.getTrips().subscribe((res: any) => {
    const trips = res.data || [];

    this.totalTrips = trips.length;
    this.completedTrips = trips.filter((t:any) => t.status === 'COMPLETED').length;

    this.recentTrips = trips.slice(0, 6); // latest 6
  });

  // get drivers
  this.adminService.getAllDrivers().subscribe((res: any) => {
    const drivers = res.data || [];

    this.totalDrivers = drivers.length;
    this.activeDrivers = drivers.filter((d:any) => d.isVerified).length;
  });
}

}
