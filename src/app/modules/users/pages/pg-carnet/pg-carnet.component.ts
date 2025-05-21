import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { MessageService } from 'primeng/api';
import { CardModule } from 'primeng/card';
import { PanelModule } from 'primeng/panel';
import { SkeletonModule } from 'primeng/skeleton';
import { ToastModule } from 'primeng/toast';
import { RolService } from '../../../../services/otros/RolService';
import { swTerminosService } from '../../../../services/usuarios/Terminos.service';
import { delay } from 'rxjs';
import { SwCasService } from '../../../../utils/cas/sw-cas.service';
import { QrService } from '../../../../services/qr/QrService';
import { Router } from '@angular/router';
import { EventosService } from '../../../../services/otros/EventosService';
import { QrInfo } from '../../../../services/otros/QrInfoService';

@Component({
  selector: 'app-pg-carnet',
  standalone: true,
  imports: [CommonModule, PanelModule, CardModule, ToastModule, SkeletonModule],
  templateUrl: './pg-carnet.component.html',
  styleUrl: './pg-carnet.component.css',
  providers: [MessageService],
})
export class PgCarnetComponent {
  infoCarnet: any;
  mostrarCarnet: boolean = true;
  private messageService = inject(MessageService);
  private swRol = inject(RolService);
  private swTerminos = inject(swTerminosService);
  private swCas = inject(SwCasService);
  private qr = inject(QrService);
  private swEventosServices = inject(EventosService);
  private qrInfo = inject(QrInfo);

  strTerminos = signal('');
  fecha = signal(new Date());
  rol = 0;
  private router = inject(Router);

  constructor() {
    this.rol = Number(sessionStorage.getItem('rol'));
  }

  ngOnInit() {
    // this.obtenerCarnet(this.swCas.getUserInfo().per_id);
    this.getTerminos(this.rol);

    this.swEventosServices.rolCambiado.subscribe((rol: any) => {
      this.rol = rol;
      if (rol != 6) {
      }
      this.obtenerCarnet(this.swCas.getUserInfo().per_id);
      this.getTerminos(rol);
    });
  }

  obtenerCarnet = (per_id: string) => {
    this.qr
      .buscarCarnet(per_id)

      .subscribe((carnet) => {
        if (carnet.count == 0) {
          this.messageService.add({
            severity: 'info',
            summary: 'Información',
            detail: carnet.message,
          });
          if (this.rol != 1) this.router.navigate(['/enrolamiento']);
        }

        if (carnet.count < 0) {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: carnet.message,
          });
        }
        if (carnet.count > 0) {
          let ff = new Date(carnet.data[0].dtFecha_Fin);
          ff.setHours(ff.getHours() + 5); // Se le suma 5 horas para que la fecha sea la correcta en el calendario

          this.fecha.set(ff);
          if (new Date() < this.fecha()) {
            this.infoCarnet = this.rol;
            this.qrInfo.datos = carnet.data[0];
            if (!this.mostrarCarnet)
              this.messageService.add({
                severity: 'success',
                summary: 'Éxito',
                detail: carnet.message,
              });
            this.mostrarCarnet = true;
          } else {
            if (this.rol != 1) this.router.navigate(['/enrolamiento']);
          }
        }
      });
  };

  getTerminos = (rol: any) => {
    this.swTerminos
      .getTerminosByIdRol(rol)
      .pipe()
      .subscribe((terminos) => {
        if (terminos.count > 0) {
          this.strTerminos.set(terminos.data[0].strDescripcion);
        } else {
          this.strTerminos.set('Este Rol No tiene terminos');
        }
      });
  };

  opencarnet() {
    this.router.navigate(['/dashboard/users/qr']);
  }
}
