import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AdminService {

  private baseUrl = 'http://localhost:5000/api/v1';

  constructor(private http: HttpClient) { }

  login(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/login`, data);
  }

  logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('role');
  }

  getAllDrivers(): Observable<any> {
    return this.http.get(`${this.baseUrl}/drivers`);
  }

  updateDriverStatus(id: string, status: boolean) {
    return this.http.put(`${this.baseUrl}/drivers/${id}`, {
      isVerified: status
    });
  }

  addDriver(data: any) {
    const formData = new FormData();

    formData.append('name', data.name || '');
    formData.append('email', data.email || '');
    formData.append('password', data.password || '');
    formData.append('phone', data.phone || '');
    formData.append('vehicleNumber', data.vehicleNumber || '');
    formData.append('experience', String(data.experience || '0'));
    formData.append('address', data.address || '');
    formData.append('emergencyContact', data.emergencyContact || '');

    if (data.license) {
      formData.append('license', data.license);
    }

    return this.http.post(`${this.baseUrl}/auth/register`, formData);
  }

  updateDriver(id: string, data: any) {
    return this.http.put(`${this.baseUrl}/drivers/${id}`, data);
  }

  deleteDriver(id: string) {
    return this.http.delete(`${this.baseUrl}/drivers/${id}`);
  }

  addTrip(data: any) {
    return this.http.post(`${this.baseUrl}/trips`, data);
  }

  getTrips() {
    return this.http.get(`${this.baseUrl}/trips`);
  }

  assignDriver(tripId: string, driverId: string, distance?: number) {
    return this.http.patch(
      `${this.baseUrl}/trips/${tripId}/assign`,
      { driverId, distance }
    );
  }

  updateTrip(id: string, data: any) {
    return this.http.put(`${this.baseUrl}/trips/${id}`, data);
  }

  deleteTrip(id: string) {
    return this.http.delete(`${this.baseUrl}/trips/${id}`);
  }

  getFareConfig(): Observable<any> {
  return this.http.get(`${this.baseUrl}/trips/fare-config`);
}

updateFareConfig(data: any): Observable<any> {
  return this.http.patch(
    `${this.baseUrl}/trips/fare-config`,
    data
  );
}

}
