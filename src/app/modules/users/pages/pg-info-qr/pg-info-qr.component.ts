// cspell:disable
import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { QrCodeComponent } from 'ng-qrcode';
import { InputGroupModule } from 'primeng/inputgroup';
import { FotoService } from '../../../../services/otros/FotoService';
import { SwCasService } from '../../../../utils/cas/sw-cas.service';
import { swUsuariosService } from '../../../../services/usuarios/Usuarios.service';
import { Router } from '@angular/router';
import { QrInfo } from '../../../../services/otros/QrInfoService';
import { QrService } from '../../../../services/qr/QrService';

@Component({
  selector: 'app-pg-info-qr',
  imports: [
    CommonModule,
    QrCodeComponent,
    CardModule,
    InputGroupModule,
    InputTextModule,
    FormsModule,
  ],
  templateUrl: './pg-info-qr.component.html',
  styleUrl: './pg-info-qr.component.css'
})
export class PgInfoQrComponent {
  nombre: any;
  apellidos: any;
  cedula: any;
  correo: any;
  dependencia: any;
  rol: any;
  datos: any;
  cargo: string = '';

  foto = signal<string>('');
  public base64textString: any = [];

  swFoto = inject(FotoService);
  private swCas = inject(SwCasService);
  private swUser = inject(swUsuariosService);
  private router = inject(Router);
  private qrInfo = inject(QrInfo);
  private qr = inject(QrService);

  ngOnInit() {
    this.nombre = this.swCas.getUserInfo().nombres;
    this.apellidos = this.swCas.getUserInfo().apellidos;
    this.cedula = this.swCas.getUserInfo().cedula;
    this.correo = this.swCas.getUserInfo().per_email;
    this.rol = sessionStorage.getItem('rol');

    if (this.qrInfo.datos.intIdCarnet == undefined) {
      this.router.navigate(['/dashboard/users/']);
    } else {
      const json = {
        intCarnet: this.qrInfo.datos.intIdCarnet,
        intRol: this.rol == 3 ? this.rol : 1,
      };
      this.qr.generarQr(json).subscribe((obj) => {
        this.datos = JSON.stringify(obj.data[0]);
      });
      this.obtenerFotoGeneral();
    }
  }

  getRoles = () => {
    this.swUser
      .getRolesByUser(Number(this.swCas.getUserInfo().per_id))
      .subscribe((obj) => {
        if (obj && obj.data && obj.data.length > 0) {
          this.dependencia = obj.data[0].strDepencia;
          this.cargo = obj.data[0].strCargo;
        }
      });
  };

  obtenerFotoGeneral() {
    this.swFoto.consultarDinardap(this.cedula).subscribe({
      next: (res) => {
        if (res && res.success && res.Informacion && res.Informacion.blProceso && res.Informacion.Datos && res.Informacion.Datos.valor && res.Informacion.Datos.valor.trim() !== '') {
          const valor = res.Informacion.Datos.valor;
          const imgUrl = valor.startsWith('data:') ? valor : 'data:image/jpeg;base64,' + valor;
          this.foto.set(imgUrl);
          this.getRoles();
        } else {
          this.obtenerFotoPorRoles();
        }
      },
      error: () => {
        this.obtenerFotoPorRoles();
      }
    });
  }

  obtenerFotoPorRoles() {
    if (this.rol == 3) {
      const numeroConGuion =
        this.cedula.slice(0, 9) + '-' + this.cedula.slice(9);
      this.obtenerFotoAcademico(numeroConGuion);
    } else {
      this.obtenerFotoTTHH(this.swCas.getUserInfo().per_id);
      this.getRoles();
    }
  }

  obtenerFotoTTHH(usuario: any) {
    this.swUser.getFotoTTHH(usuario).subscribe((objImg) => {
      this.foto.set(objImg.imgArchivo);
    });
  }

  obtenerFotoAcademico = async (usuario: any) => {
    const { listado } = await this.swUser.getInformacionEstudianteSYNC(usuario);
    if (listado.length == 0) {
      const { imgArchivo } = await this.swUser.getFotoTTHHASYNC(
        this.swCas.getUserInfo().per_id
      );
      this.foto.set(imgArchivo);
      this.getRoles();
    } else {
      const [info] = listado;
      // console.log('strfoto: ', info.strfoto);
      this.foto.set(info.strfoto);
      // console.log('si pasa', this.foto());
      this.getRoles();
    }
  };
}
