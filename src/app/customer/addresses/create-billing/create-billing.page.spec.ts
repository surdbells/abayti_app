import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CreateBillingPage } from './create-billing.page';

describe('CreateBillingPage', () => {
  let component: CreateBillingPage;
  let fixture: ComponentFixture<CreateBillingPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateBillingPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
