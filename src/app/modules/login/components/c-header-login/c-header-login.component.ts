import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { SwCasService } from '../../../../utils/cas/sw-cas.service';

@Component({
  selector: 'app-c-header-login',
  standalone: true,
  imports: [CommonModule, ButtonModule, SkeletonModule],
  templateUrl: './c-header-login.component.html',
  styleUrl: './c-header-login.component.css',
})
export class CHeaderLoginComponent {
  private swCas = inject(SwCasService);
  @Input()
  logo = 'logo-espoch.svg';
  press = () => {
    this.swCas.loginLocal();
  };
}
