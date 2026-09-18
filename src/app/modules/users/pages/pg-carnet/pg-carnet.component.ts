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
  imports: [CommonModule, PanelModule, CardModule, ToastModule, SkeletonModule],
  templateUrl: './pg-carnet.component.html',
  styleUrl: './pg-carnet.component.css',
  providers: [MessageService]
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
  isCaducado = signal(false);
  imagenCargada = signal<boolean>(false);
  imagenError = signal<boolean>(false);
  rol = 0;
  private router = inject(Router);

  constructor() {
    this.rol = Number(sessionStorage.getItem('rol'));
  }

  ngOnInit() {
    const userInfo = this.swCas.getUserInfo();
    if (userInfo && userInfo.per_id) {
      this.obtenerCarnet(userInfo.per_id);
    }
    this.getTerminos(this.rol);

    this.swEventosServices.rolCambiado.subscribe((rol: any) => {
      this.rol = rol;
      this.imagenCargada.set(false);
      this.imagenError.set(false);
      // console.log('this.rol: ', this.rol);
      const user = this.swCas.getUserInfo();
      if (user && user.per_id) {
        this.obtenerCarnet(user.per_id);
      }
      this.getTerminos(rol);
    });
  }

  getCarnetImgSrc(): string {
    const r = Number(this.rol);
    if ([1, 2, 3, 4, 5, 6].includes(r)) {
      return `./carnet/${r}.svg`;
    }
    // Para roles de gestión (11), vinculación (13) u otros, se utiliza la credencial institucional 1.svg
    return './carnet/1.svg';
  }

  onImageLoad() {
    this.imagenCargada.set(true);
    this.imagenError.set(false);
  }

  onImageError(event?: any) {
    const target = event?.target as HTMLImageElement;
    if (target && !target.src.endsWith('1.svg')) {
      target.src = './carnet/1.svg';
    } else {
      this.imagenError.set(true);
      this.imagenCargada.set(false);
    }
  }

  getNombreRol(): string {
    switch (this.rol) {
      case 1:
        return 'Docente';
      case 2:
        return 'Funcionario / Administrativo';
      case 3:
        return 'Estudiante';
      case 4:
        return 'Invitado / Visitante';
      case 5:
        return 'Proveedor';
      case 6:
        return 'Guardia de Seguridad';
      case 11:
        return 'Gestión Institucional';
      case 13:
        return 'Vinculación';
      default:
        return 'Miembro Institucional';
    }
  }

  obtenerCarnet = (per_id: string) => {
    if (!per_id || per_id === 'undefined') {
      console.log('ID de persona no válido para obtener carnet');
      return;
    }

    // Intentar leer de caché local para respuesta instantánea en conexiones lentas
    try {
      const cached = localStorage.getItem('espochpass_carnet_data');
      if (cached) {
        const parsed = JSON.parse(cached);
        this.qrInfo.datos = parsed;
        if (parsed.dtFecha_Fin) {
          let ff = new Date(parsed.dtFecha_Fin);
          ff.setHours(ff.getHours() + 5);
          this.fecha.set(ff);
          this.isCaducado.set(new Date() > ff);
        }
      }
    } catch (e) {
      console.error('Error al leer caché local de carnet', e);
    }

    this.qr
      .buscarCarnet(per_id)
      .subscribe({
        next: (carnet) => {
          // console.log('carnet', carnet);
          if (carnet.count == 0) {
            this.messageService.add({
              severity: 'info',
              summary: 'Información',
              detail: carnet.message,
            });
            this.router.navigate(['/enrolamiento']);
            return;
          }

          if (carnet.count < 0) {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: carnet.message,
            });
            return;
          }

          let ff = new Date(carnet.data[0].dtFecha_Fin);
          ff.setHours(ff.getHours() + 5); // Se le suma 5 horas para que la fecha sea la correcta en el calendario

          this.fecha.set(ff);
          this.isCaducado.set(new Date() > ff);

          this.infoCarnet = this.rol;
          this.qrInfo.datos = carnet.data[0];
          try {
            localStorage.setItem('espochpass_carnet_data', JSON.stringify(carnet.data[0]));
          } catch (e) {}

          this.mostrarCarnet = true;
        },
        error: (err) => {
          console.error('Error al buscar carnet o usuario sin conexión', err);
          if (this.qrInfo.datos?.intIdCarnet) {
            this.mostrarCarnet = true;
            return;
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
