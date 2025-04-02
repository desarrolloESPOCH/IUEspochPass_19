import { Component, inject } from '@angular/core';
import { SwCasService } from '../../../../utils/cas/sw-cas.service';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-pg-logout',
  standalone: true,
  imports: [],
  templateUrl: './pg-logout.component.html',
  styleUrl: './pg-logout.component.css',
})
export class PgLogoutComponent {
  private swCierreSesion = inject(SwCasService);
  private router = inject(Router);
  private alerty = inject(MessageService);

  constructor() {
    this.swCierreSesion.removeSession();
    this.alerty.add({
      severity: 'info',
      summary: 'Cierre de sesión',
      detail: 'Se ha cerrado la sesión correctamente.',
    });
    // this.router.navigate(['/cas']);
  }
}
