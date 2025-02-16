import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CHeaderLoginComponent } from '../../components/c-header-login/c-header-login.component';
import { CSplashComponent } from '../../components/c-splash/c-splash.component';
import { CLandingComponent } from '../../components/c-landing/c-landing.component';
import { ICarrusel } from '../../interface/ICarrusel.interfaces';

@Component({
  selector: 'app-pg-login',
  standalone: true,
  imports: [CommonModule, CSplashComponent, CLandingComponent],
  templateUrl: './pg-login.component.html',
  styleUrl: './pg-login.component.css',
})
export default class PgLoginComponent {
  wait = signal(true);
  imgs: ICarrusel[] = [
    { src: 'https://oficina.espoch.edu.ec/dtic/images/1.jpg', class: 'slide' },
    {
      src: 'https://oficina.espoch.edu.ec/dtic/images/7.jpg',
      class: 'slide-2',
    },
    {
      src: 'https://oficina.espoch.edu.ec/dtic/images/9.jpg',
      class: 'slide-3',
    },
  ];
  constructor() {
    if (this.wait()) {
      setTimeout(() => {
        this.wait.set(false);
      }, 2500);
    }
  }
}
