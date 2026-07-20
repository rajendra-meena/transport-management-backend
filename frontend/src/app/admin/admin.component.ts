import { Component, HostListener, OnInit } from '@angular/core';
import { AdminService } from '../service/admin/admin.service';
import { Router } from '@angular/router';
 

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent  {

  constructor(private adminService:AdminService,private router: Router){}

isCollapsed = false;

  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
  }

  logout() {
  this.adminService.logout();
  this.router.navigate(['/']);
}
}