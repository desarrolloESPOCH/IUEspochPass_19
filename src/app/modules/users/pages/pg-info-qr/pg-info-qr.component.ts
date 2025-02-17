import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { QrCodeModule } from 'ng-qrcode';
import { InputGroupModule } from 'primeng/inputgroup';
import { FotoService } from '../../../../services/otros/FotoService';
import { SwCasService } from '../../../../utils/cas/sw-cas.service';
import { swUsuariosService } from '../../../../services/usuarios/Usuarios.service';
import { Router } from '@angular/router';
import { QrInfo } from '../../../../services/otros/QrInfoService';
import { QrService } from '../../../../services/qr/QrService';

@Component({
  selector: 'app-pg-info-qr',
  standalone: true,
  imports: [
    CommonModule,
    QrCodeModule,
    CardModule,
    InputGroupModule,
    InputTextModule,
    FormsModule,
  ],
  templateUrl: './pg-info-qr.component.html',
  styleUrl: './pg-info-qr.component.css',
})
export class PgInfoQrComponent {
  nombre: any;
  apellidos: any;
  cedula: any;
  correo: any;
  dependencia: any;
  rol: any;
  datos: any;

  foto: any = '';
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
        console.log('obj: ', obj);
        this.datos = JSON.stringify(obj.data[0]);
      });
      if (this.rol == 3) {
        const numeroConGuion =
          this.cedula.slice(0, 9) + '-' + this.cedula.slice(9);
        this.obtenerFotoAcademico(numeroConGuion);
        console.log('this.cedula: ', numeroConGuion);
      } else {
        this.obtenerFotoTTHH(this.swCas.getUserInfo().per_id);
        this.getRoles();
      }
    }
  }

  getRoles = () => {
    this.swUser
      .getRolesByUser(Number(this.swCas.getUserInfo().per_id))
      .subscribe((obj) => {
        this.dependencia = obj.data[0].strDepencia;
      });
  };

  obtenerFotoTTHH(usuario: any) {
    this.swUser.getFotoTTHH(usuario).subscribe((objImg) => {
      this.foto = objImg.imgArchivo;
    });
  }

  obtenerFotoAcademico(usuario: any) {
    this.swUser.getInformacionEstudiante(usuario).subscribe((objImg: any) => {
      this.foto = objImg.listado[0].strfoto;
      this.getRoles();
      //   this.dependencia =
      //     objImg.listado[0].carreraSelecionadaFacultad +
      //     ' - ' +
      //     objImg.listado[0].carreraSeleccionada;
      // });
    });
  }
}
