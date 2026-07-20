import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyEarningsComponent } from './my-earnings.component';

describe('MyEarningsComponent', () => {
  let component: MyEarningsComponent;
  let fixture: ComponentFixture<MyEarningsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MyEarningsComponent]
    });
    fixture = TestBed.createComponent(MyEarningsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
