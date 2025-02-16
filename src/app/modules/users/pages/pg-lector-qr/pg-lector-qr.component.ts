import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { SwCasService } from '../../../../utils/cas/sw-cas.service';
import { QrScannerComponent } from '../../../shared/qr-scanner/qr-scanner.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-pg-lector-qr',
  standalone: true,
  imports: [ToastModule, CommonModule, QrScannerComponent],
  templateUrl: './pg-lector-qr.component.html',
  styleUrl: './pg-lector-qr.component.css',
  providers: [MessageService],
})
export class PgLectorQrComponent {
  private swCas = inject(SwCasService);
  private router = inject(Router);

  constructor() {}
  onQrScanned(code: string) {
    console.log('Código recibido en el componente padre:', code);

    this.router.navigate(['/dashboard/users/validarQr', code]);

    // alert('Código escaneado: ' + code);
  }
}
