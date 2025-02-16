import { Component, inject, input, signal } from '@angular/core';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SwCasService } from '../../../../utils/cas/sw-cas.service';
import { QrService } from '../../../../services/qr/QrService';
import { delay, firstValueFrom } from 'rxjs';
import { PanelModule } from 'primeng/panel';
import { swUsuariosService } from '../../../../services/usuarios/Usuarios.service';
import { SkeletonModule } from 'primeng/skeleton';
@Component({
  selector: 'app-pg-validar-qr',
  standalone: true,
  imports: [ProgressSpinnerModule, PanelModule, SkeletonModule],
  templateUrl: './pg-validar-qr.component.html',
  styleUrl: './pg-validar-qr.component.css',
})
export default class PgValidarQrComponent {
  codigoQr = input.required<string>();
  private swCas = inject(SwCasService);
  private swQr = inject(QrService);
  private swUser = inject(swUsuariosService);

  isLoading = signal(true);
  User = signal<any>({});
  foto = signal<string>('');
  dependencia = signal<string>('');
  cargo = signal<string>('');

  ngOnInit() {
    console.log('codigoQr: ', this.codigoQr());
    this.validarQr();
  }

  validarQr = () => {
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
          this.isLoading.set(false);
          if (response.count > 0) {
            this.User.set(response.data[0]);
            console.log('response: ', this.User().intIdPersona);
            this.getFoto(this.User().intIdPersona);
            this.obtenerDataAcademico(this.User().strCedula);
            this.getRoles();
          } else {
            console.log('codigo invalido: ', response);
          }
        },
        error: (e) => {
          this.isLoading.set(false);
        },
      });
  };

  obtenerDataAcademico = async (cedula: string) => {
    try {
      let cedula_ = cedula.slice(0, 9) + '-' + cedula.slice(9, 10);
      const estudiante = await firstValueFrom(
        this.swUser.getInformacionEstudiante(cedula)
      );
      console.log('estudiante: ', estudiante);
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
}

export interface IQrValidarParams {
  strHash: string;
  intIdQr: string;
  strUsuarioRegitro: number;
  intTipoRegistro: number;
  intEstado: number;
}
