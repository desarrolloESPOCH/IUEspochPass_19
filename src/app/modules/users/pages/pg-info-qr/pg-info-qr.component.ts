// cspell:disable
import { CommonModule } from '@angular/common';
import { Component, inject, signal, OnInit } from '@angular/core';
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
export class PgInfoQrComponent implements OnInit {
  nombre: any;
  apellidos: any;
  cedula: any;
  correo: any;
  dependencia: any;
  rol: any;
  datos: any;
  cargo: string = '';
  nombreRol: string = '';

  foto = signal<string>('');
  public base64textString: any = [];

  swFoto = inject(FotoService);
  private swCas = inject(SwCasService);
  private swUser = inject(swUsuariosService);
  private router = inject(Router);
  private qrInfo = inject(QrInfo);
  private qr = inject(QrService);

  onFotoError() {
    this.foto.set('./avatar.png');
  }

  ngOnInit() {
    const userInfo = this.swCas.getUserInfo();
    this.nombre = userInfo?.nombres;
    this.apellidos = userInfo?.apellidos;
    this.cedula = userInfo?.cedula;
    this.correo = userInfo?.per_email;
    this.rol = sessionStorage.getItem('rol');

    // Intentar recuperar carnet desde memoria o caché local
    if (!this.qrInfo.datos?.intIdCarnet) {
      try {
        const cached = localStorage.getItem('espochpass_carnet_data');
        if (cached) {
          this.qrInfo.datos = JSON.parse(cached);
        }
      } catch (e) {}
    }

    if (this.qrInfo.datos?.intIdCarnet) {
      this.generarCodigoQr(this.qrInfo.datos.intIdCarnet);
    } else if (userInfo?.per_id) {
      this.qr.buscarCarnet(userInfo.per_id).subscribe({
        next: (carnet) => {
          if (carnet && carnet.data && carnet.data.length > 0) {
            this.qrInfo.datos = carnet.data[0];
            try {
              localStorage.setItem('espochpass_carnet_data', JSON.stringify(carnet.data[0]));
            } catch (e) {}
            this.generarCodigoQr(carnet.data[0].intIdCarnet);
          } else {
            this.generarFallbackQr();
          }
        },
        error: () => {
          this.generarFallbackQr();
        }
      });
    } else {
      this.generarFallbackQr();
    }

    this.obtenerFotoGeneral();
  }

  generarCodigoQr(intCarnet: any) {
    const json = {
      intCarnet: Number(intCarnet),
      intRol: this.rol == 3 ? this.rol : 1,
    };
    this.qr.generarQr(json).subscribe({
      next: (obj) => {
        if (obj && obj.data && obj.data.length > 0) {
          const item = obj.data[0];
          this.datos = JSON.stringify({
            intIdQr: item.intIdQr,
            strHash: item.strHash,
          });
          try {
            localStorage.setItem('espochpass_qr_' + intCarnet, this.datos);
          } catch (e) {}
        }
      },
      error: () => {
        const cached = localStorage.getItem('espochpass_qr_' + intCarnet);
        if (cached) {
          this.datos = cached;
        } else {
          this.generarFallbackQr();
        }
      }
    });
  }

  generarFallbackQr() {
    this.datos = JSON.stringify({
      cedula: this.cedula || 'ESPOCH',
      usuario: `${this.nombre || ''} ${this.apellidos || ''}`.trim(),
      rol: this.rol || 1,
    });
  }

  getRoles = () => {
    this.swUser
      .getRolesByUser(Number(this.swCas.getUserInfo()?.per_id))
      .subscribe((obj) => {
        if (obj && obj.data && obj.data.length > 0) {
          this.dependencia = obj.data[0].strDepencia;
          this.cargo = obj.data[0].strCargo;
          this.nombreRol = obj.data[0].strNombre || '';
        }
      });
  };

  obtenerFotoGeneral() {
    this.swFoto.consultarDinardap(this.cedula).subscribe({
      next: (res) => {
        if (
          res &&
          res.success &&
          res.Informacion &&
          res.Informacion.blProceso &&
          res.Informacion.Datos &&
          res.Informacion.Datos.valor &&
          res.Informacion.Datos.valor.trim() !== ''
        ) {
          const valor = res.Informacion.Datos.valor;
          const imgUrl = valor.startsWith('data:')
            ? valor
            : 'data:image/jpeg;base64,' + valor;
          this.foto.set(imgUrl);
          this.getRoles();
        } else {
          this.obtenerFotoPorRoles();
        }
      },
      error: () => {
        this.obtenerFotoPorRoles();
      },
    });
  }

  obtenerFotoPorRoles() {
    if (this.rol == 3) {
      const numeroConGuion =
        this.cedula.slice(0, 9) + '-' + this.cedula.slice(9);
      this.obtenerFotoAcademico(numeroConGuion);
    } else {
      this.obtenerFotoTTHH(this.swCas.getUserInfo()?.per_id);
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
        this.swCas.getUserInfo()?.per_id
      );
      this.foto.set(imgArchivo);
      this.getRoles();
    } else {
      const [info] = listado;
      this.foto.set(info.strfoto);
      this.getRoles();
    }
  };
}
