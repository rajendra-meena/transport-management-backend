import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DriverManagementComponent } from './driver-management.component';

describe('DriverManagementComponent', () => {
  let component: DriverManagementComponent;
  let fixture: ComponentFixture<DriverManagementComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DriverManagementComponent]
    });
    fixture = TestBed.createComponent(DriverManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
