import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CHeaderLoginComponent } from '../c-header-login/c-header-login.component';
import { CFooterComponent } from '../c-footer/c-footer.component';

@Component({
  selector: 'app-c-landing',
  standalone: true,
  imports: [CommonModule, CHeaderLoginComponent, CFooterComponent],
  templateUrl: './c-landing.component.html',
  styleUrl: './c-landing.component.css',
})
export class CLandingComponent {}
