import { Component, inject, input, signal } from '@angular/core';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SwCasService } from '../../../../utils/cas/sw-cas.service';
import { QrService } from '../../../../services/qr/QrService';
import { delay, firstValueFrom } from 'rxjs';
import { swUsuariosService } from '../../../../services/usuarios/Usuarios.service';
import { FotoService } from '../../../../services/otros/FotoService';
import { SkeletonModule } from 'primeng/skeleton';
import { DividerModule } from 'primeng/divider';
import { FieldsetModule } from 'primeng/fieldset';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { Router } from '@angular/router';

@Component({
  selector: 'app-pg-validar-qr',
  imports: [
    ProgressSpinnerModule,
    SkeletonModule,
    DividerModule,
    FieldsetModule,
    ButtonModule,
    DialogModule,
  ],
  templateUrl: './pg-validar-qr.component.html',
  styleUrl: './pg-validar-qr.component.css'
})
export default class PgValidarQrComponent {
  codigoQr = input.required<string>();
  private swCas = inject(SwCasService);
  private swQr = inject(QrService);
  private swUser = inject(swUsuariosService);
  private swFoto = inject(FotoService);
  private router = inject(Router);
  isValid = signal(true);

  isLoading = signal(true);
  User = signal<any>({});
  foto = signal<string>('');
  dependencia = signal<string>('');
  cargo = signal<string>('');

  showModal = signal<boolean>(false);

  ngOnInit() {
    this.validarQr();
  }

  esJsonValido(cadena: string) {
    try {
      JSON.parse(cadena);
      return true;
    } catch (error) {
      return false;
    }
  }

  validarQr = () => {
    if (!this.esJsonValido(this.codigoQr())) {
      this.isLoading.set(false);
      this.isValid.set(false);
      return;
    }
    let infoQr = JSON.parse(this.codigoQr());
    const datos: IQrValidarParams = {
      strHash: infoQr.strHash,
      intIdQr: infoQr.intIdQr,
      strUsuarioRegitro: Number(this.swCas.getUserInfo().per_id),
      intTipoRegistro: 1,
      intEstado: 1,
    };
    this.getValidar(datos);
  };

  getValidar = (json: IQrValidarParams) => {
    this.swQr
      .validarQr(json)
      .pipe(delay(500))
      .subscribe({
        next: (response) => {
          this.isLoading.set(false);
          if (response.count > 0) {
            this.User.set(response.data[0]);
            this.getRoles();
            this.obtenerFotoDinardap(this.User().strCedula);
          } else {
            this.isValid.set(false);
            this.isLoading.set(false);
          }
        },
        error: (e) => {
          this.isValid.set(false);
          // console.log('e: ', e);
          this.isLoading.set(false);
        },
      });
  };

  obtenerFotoDinardap = (cedula: string) => {
    this.swFoto.consultarDinardap(cedula).subscribe({
      next: (res) => {
        if (res && res.success && res.Informacion && res.Informacion.blProceso && res.Informacion.Datos && res.Informacion.Datos.valor && res.Informacion.Datos.valor.trim() !== '') {
          const valor = res.Informacion.Datos.valor;
          const imgUrl = valor.startsWith('data:') ? valor : 'data:image/jpeg;base64,' + valor;
          this.foto.set(imgUrl);
        } else {
          // Fallback a los servicios locales
          this.obtenerDataAcademico(cedula);
          this.getFoto(this.User().intIdPersona);
        }
      },
      error: () => {
        // Fallback en caso de error
        this.obtenerDataAcademico(cedula);
        this.getFoto(this.User().intIdPersona);
      }
    });
  };

  obtenerDataAcademico = async (cedula: string) => {
    try {
      let cedula_ = cedula.slice(0, 9) + '-' + cedula.slice(9, 10);
      const estudiante = await firstValueFrom(
        this.swUser.getInformacionEstudiante(cedula_)
      );
      if (estudiante && estudiante.listado && estudiante.listado.length > 0) {
        if (!this.foto() || this.foto().trim() === '') {
          this.foto.set(estudiante.listado[0].strfoto);
        }
      }
    } catch (e) {
      console.error('error: ', e);
    }
  };

  getRoles = () => {
    this.swUser
      .getRolesByUser(this.User().intIdPersona)
      .subscribe((response) => {
        if (response && response.data && response.data.length > 0) {
          this.cargo.set(response.data[0].strCargo);
          this.dependencia.set(response.data[0].strDepencia);
        }
      });
  };

  getFoto = (perId: string) => {
    this.swUser.getFotoTTHH(perId).subscribe((objImg) => {
      if (!this.foto() || this.foto().trim() === '') {
        this.foto.set(objImg.imgArchivo);
      }
    });
  };

  nativage = () => {
    this.router.navigate(['/dashboard/users/lector']);
  };
}

export interface IQrValidarParams {
  strHash: string;
  intIdQr: string;
  strUsuarioRegitro: number;
  intTipoRegistro: number;
  intEstado: number;
}
