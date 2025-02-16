import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CLineaRolComponent } from './c-linea-rol.component';

describe('CLineaRolComponent', () => {
  let component: CLineaRolComponent;
  let fixture: ComponentFixture<CLineaRolComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CLineaRolComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CLineaRolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
