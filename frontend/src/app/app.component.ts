import { Component, OnInit } from '@angular/core';
import { FcmService } from './service/fcm.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'ramTransport';

  constructor(private fcmService: FcmService) {}

  ngOnInit() {
    // Listen to foreground notifications
    this.fcmService.listenForMessages();

    // If already logged in on application load, request permission and fetch token
    const token = localStorage.getItem('authToken');
    if (token) {
      this.fcmService.requestPermissionAndGetToken();
    }
  }
}
