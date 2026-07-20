import { Component, OnInit } from '@angular/core';
import { AdminService } from 'src/app/service/admin/admin.service';

declare var bootstrap: any;


@Component({
  selector: 'app-driver-management',
  templateUrl: './driver-management.component.html',
  styleUrls: ['./driver-management.component.scss']
})
export class DriverManagementComponent implements OnInit {

  constructor(private adminService: AdminService,) { }

  newDriver: any = {
    name: '',
    email: '',
    password: '',
    phone: '',
    vehicleNumber: '',
    experience: '',
    address: '',
    emergencyContact: '',
    license: null
  };

  showModal = false;

  openModal() {
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  onFileChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.newDriver.license = file;
    }
  }



  addDriver() {
    this.adminService.addDriver(this.newDriver).subscribe({
      next: () => {
        this.showAlert('success', 'Driver added successfully');
        this.getData();

        // ✅ CLOSE MODAL PROPERLY
        const modalEl = document.getElementById('addDriverModal');
        const modal = bootstrap.Modal.getInstance(modalEl)
          || new bootstrap.Modal(modalEl);

        modal.hide();

        // reset form
        this.newDriver = {
          name: '',
          email: '',
          password: '',
          phone: '',
          vehicleNumber: '',
          experience: '',
          address: '',
          emergencyContact: '',
          license: null
        };
      },
      error: (err) => {
        console.log(err.error);
        this.showAlert('error', 'Failed to add driver');
      }
    });
  }

  selectedDriverId: string = '';

  openEditModal(driver: any) {
    this.selectedDriverId = driver._id;

    // prefill form
    this.newDriver = {
      name: driver.name,
      email: driver.email,
      password: '', // usually not updated
      phone: driver.phone,
      vehicleNumber: driver.vehicleNumber,
      experience: driver.experience,
      address: driver.address,
      emergencyContact: driver.emergencyContact,
      license: null
    };

    // open modal
    const modalEl = document.getElementById('addDriverModal');
    const modal = new (window as any).bootstrap.Modal(modalEl);
    modal.show();
  }

  updateDriver() {
    this.adminService.updateDriver(this.selectedDriverId, this.newDriver).subscribe({
      next: () => {
        this.showAlert('success', 'Driver updated successfully');
        this.getData();

        const modalEl = document.getElementById('addDriverModal');
        const modal = (window as any).bootstrap.Modal.getInstance(modalEl);
        modal.hide();
      },
      error: () => {
        this.showAlert('error', 'Failed to update driver');
      }
    });
  }

  deleteDriverId: string = '';
  deleteDriverName: string = '';

  openDeleteModal(driver: any) {
    this.deleteDriverId = driver._id;
    this.deleteDriverName = driver.name;

    const modalEl = document.getElementById('deleteModal');
    const modal = new (window as any).bootstrap.Modal(modalEl);
    modal.show();
  }


  confirmDelete() {
    this.adminService.deleteDriver(this.deleteDriverId).subscribe({
      next: () => {
        this.showAlert('success', 'Driver deleted successfully');
        this.getData();

        const modalEl = document.getElementById('deleteModal');
        const modal = (window as any).bootstrap.Modal.getInstance(modalEl);
        modal.hide();
      },
      error: () => {
        this.showAlert('error', 'Failed to delete driver');
      }
    });
  }


  ngOnInit(): void {
    this.getData();
  }

  drivers: any[] = [];
  filteredDrivers: any[] = [];

  searchText: string = '';
  currentPage: number = 1;
  itemsPerPage: number = 5;

  getData() {
    this.adminService.getAllDrivers().subscribe({
      next: (res) => {
        this.drivers = res.data;
        this.filteredDrivers = [...this.drivers];
      },
      error: (err) => {
        console.error('Error:', err);
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

  removeAlert(alert: any) {
    this.alerts = this.alerts.filter(a => a !== alert);
  }

  toggleDriverStatus(driver: any) {
    const newStatus = !driver.isVerified;

    this.adminService.updateDriverStatus(driver._id, newStatus).subscribe({
      next: () => {
        driver.isVerified = newStatus;

        this.showAlert(
          'success',
          `Driver ${newStatus ? 'Activated' : 'Deactivated'} successfully`
        );
      },
      error: () => {
        this.showAlert('error', 'Failed to update driver status');
      }
    });
  }

  searchDrivers() {
    const term = this.searchText.toLowerCase();

    this.filteredDrivers = this.drivers.filter((driver: any) =>
      driver.name.toLowerCase().includes(term) ||
      driver.email.toLowerCase().includes(term) ||
      driver.phone.includes(term) ||
      driver.vehicleNumber.toLowerCase().includes(term)
    );

    this.currentPage = 1;
  }

  get paginatedDrivers() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredDrivers.slice(start, start + this.itemsPerPage);
  }

  totalPages() {
    return Math.ceil(this.filteredDrivers.length / this.itemsPerPage);
  }

  changePage(page: number) {
    this.currentPage = page;
  }



}
