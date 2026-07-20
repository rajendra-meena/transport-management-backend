import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class DriverService {

  private baseUrl = 'http://localhost:5000/api/v1';

  constructor(private http: HttpClient) { }

  logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('role');
  }


  getMyTrips(): Observable<any> {
    return this.http.get(`${this.baseUrl}/trips/my-trips`);
  }

  acceptTrip(tripId: string): Observable<any> {
    return this.http.patch(
      `${this.baseUrl}/trips/${tripId}/accept`,
      {}
    );
  }

  cancelTrip(tripId: string): Observable<any> {
    return this.http.patch(
      `${this.baseUrl}/trips/${tripId}/cancel`,
      {}
    );
  }

  startTrip(tripId: string): Observable<any> {
    return this.http.patch(
      `${this.baseUrl}/trips/${tripId}/start`,
      {}
    );
  }

  completeTrip(tripId: string): Observable<any> {
    return this.http.patch(
      `${this.baseUrl}/trips/${tripId}/complete`,
      {}
    );
  }

}
