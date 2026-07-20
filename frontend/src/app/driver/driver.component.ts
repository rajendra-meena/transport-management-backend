import { Component } from '@angular/core';
import { DriverService } from '../service/driver/driver.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-driver',
  templateUrl: './driver.component.html',
  styleUrls: ['./driver.component.scss']
})
export class DriverComponent {
 constructor(private adminService:DriverService,private router: Router){}

isCollapsed = false;

  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
  }

  logout() {
  this.adminService.logout();
  this.router.navigate(['/']);
}
}
