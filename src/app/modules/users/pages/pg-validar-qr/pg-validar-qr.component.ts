import { Component, inject, input, signal } from '@angular/core';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SwCasService } from '../../../../utils/cas/sw-cas.service';
import { QrService } from '../../../../services/qr/QrService';
import { delay, firstValueFrom } from 'rxjs';
import { swUsuariosService } from '../../../../services/usuarios/Usuarios.service';
import { SkeletonModule } from 'primeng/skeleton';
import { DividerModule } from 'primeng/divider';
import { FieldsetModule } from 'primeng/fieldset';
import { ButtonModule } from 'primeng/button';
import { Router } from '@angular/router';
import { MessagesModule } from 'primeng/messages';
@Component({
  selector: 'app-pg-validar-qr',
  standalone: true,
  imports: [
    ProgressSpinnerModule,
    SkeletonModule,
    DividerModule,
    FieldsetModule,
    ButtonModule,
    MessagesModule,
  ],
  templateUrl: './pg-validar-qr.component.html',
  styleUrl: './pg-validar-qr.component.css',
})
export default class PgValidarQrComponent {
  codigoQr = input.required<string>();
  private swCas = inject(SwCasService);
  private swQr = inject(QrService);
  private swUser = inject(swUsuariosService);
  private router = inject(Router);
  isValid = signal(true);

  isLoading = signal(true);
  User = signal<any>({});
  foto = signal<string>('');
  dependencia = signal<string>('');
  cargo = signal<string>('');

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
    console.log('infoQr: ', infoQr);
  };

  getValidar = (json: IQrValidarParams) => {
    this.swQr
      .validarQr(json)
      .pipe(delay(500))
      .subscribe({
        next: (response) => {
          console.log('response: ', response);
          this.isLoading.set(false);
          if (response.count > 0) {
            this.User.set(response.data[0]);
            console.log('response: ', this.User().intIdPersona);
            this.getFoto(this.User().intIdPersona);
            this.obtenerDataAcademico(this.User().strCedula);
            this.getRoles();
          } else {
            this.isValid.set(false);

            console.log('codigo invalido: ', response);
            this.isLoading.set(false);
          }
        },
        error: (e) => {
          this.isValid.set(false);

          console.log('e: ', e);
          this.isLoading.set(false);
        },
      });
  };

  obtenerDataAcademico = async (cedula: string) => {
    try {
      let cedula_ = cedula.slice(0, 9) + '-' + cedula.slice(9, 10);
      console.log('cedula_: ', cedula_);
      const estudiante = await firstValueFrom(
        this.swUser.getInformacionEstudiante(cedula_)
      );

      console.log('estudiante: ', estudiante);
      this.foto.set(estudiante.listado[0].strfoto);
    } catch (e) {
      console.log('error: ', e);
    }
  };

  getRoles = () => {
    this.swUser
      .getRolesByUser(this.User().intIdPersona)
      .subscribe((response) => {
        console.log('response: ', response);
        this.cargo.set(response.data[0].strCargo);
        this.dependencia.set(response.data[0].strDepencia);
      });
  };

  getFoto = (perId: string) => {
    this.swUser.getFotoTTHH(perId).subscribe((objImg) => {
      console.log('objImg: ', objImg);
      this.foto.set(objImg.imgArchivo);
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
