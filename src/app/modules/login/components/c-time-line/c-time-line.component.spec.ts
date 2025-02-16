import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CTimeLineComponent } from './c-time-line.component';

describe('CTimeLineComponent', () => {
  let component: CTimeLineComponent;
  let fixture: ComponentFixture<CTimeLineComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CTimeLineComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CTimeLineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
