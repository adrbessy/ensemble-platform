import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LocationSelectorComponent } from './location-selector.component';

describe('LocationSelectorComponent', () => {
  let component: LocationSelectorComponent;
  let fixture: ComponentFixture<LocationSelectorComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [LocationSelectorComponent]
    });
    fixture = TestBed.createComponent(LocationSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
