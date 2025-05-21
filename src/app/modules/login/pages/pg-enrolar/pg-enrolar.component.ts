// cspell:disable
import { Component, inject, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';

import { FieldsetModule } from 'primeng/fieldset';
import { CommonModule } from '@angular/common';

import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { swUsuariosService } from '../../../../services/usuarios/Usuarios.service';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { Router } from '@angular/router';
import { CFooterComponent } from '../../components/c-footer/c-footer.component';
import { SwCasService } from '../../../../utils/cas/sw-cas.service';
import { AccionPersonal } from '../../../../services/usuarios/interfaces/ITalentoHumano';
import { IRol } from '../../interface/IRol.interface';

@Component({
  selector: 'app-pg-enrolar',
  standalone: true,
  imports: [
    CardModule,
    ButtonModule,
    InputTextModule,
    FieldsetModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ToastModule,
    CFooterComponent,
  ],
  templateUrl: './pg-enrolar.component.html',
  styleUrl: './pg-enrolar.component.css',
  providers: [MessageService],
})
export default class PgEnrolarComponent {
  private swCas = inject(SwCasService);
  private fb = inject(FormBuilder);
  private swUser = inject(swUsuariosService);
  private alerty = inject(MessageService);
  private router = inject(Router);

  public base64textString: any = [];
  public dataEnrol: any;
  public cargo: any;
  public dependencia: any;
  conexion = signal('');
  public enrolado: Boolean = false;
  public sinMatricula: Boolean = false;

  frmRegistro: FormGroup = {} as FormGroup;
  tokenTTHH = signal<string>('');
  rol: number = 2;
  ngOnInit() {
    this.dataEnrol = this.swCas.getUserInfo();

    if (!this.dataEnrol.per_id) {
      console.log('No se loguea aun');
    } else {
      this.formBuilder(this.dataEnrol);
      this.consultarDatos();
    }
  }

  consultarDatos = async () => {
    await this.obtenerToken();
    await this.getCargos(this.dataEnrol);
  };

  obtenerToken = async () => {
    const { token } = await this.swUser.getAccesoTokenTTHH_SYNC();
    this.tokenTTHH.set(token);
  };

  getCargos = async (usuario: any) => {
    const { cedula } = usuario;

    const res = await this.swUser.validarGuardia(this.dataEnrol.per_id);
    const { data: roles } = res;

    if (roles.some((item: IRol) => item.intIdRol == 6 && item.intEstado == 1)) {
      this.rol = 6;
      this.getFoto(usuario);
      this.frmRegistro.patchValue({
        cargo: 'GUARDIA',
        dependencia: 'ESPOCH',
      });
    }

    const { success, data } = await this.swUser.getCargoDependenciaTTHH_SYNC(
      cedula,
      this.tokenTTHH()
    );
    if (!success) {
      this.rol = 3;
      this.obtenerDataAcademico(usuario);
      return;
    }

    const { contrato, accionPersonal } = data;
    this.getFoto(usuario);

    if (contrato) {
      console.log('aqui: ');
      const { conCargo } = contrato;
      if (conCargo) {
        conCargo.includes('PROFESOR') ? (this.rol = 4) : (this.rol = 2);
        this.cargo = contrato.conCargo;
        this.dependencia = contrato.conDependenciaEspecifica;
      }
    }
    if (accionPersonal) {
      const { apeCargo } = accionPersonal;
      if (apeCargo) {
        apeCargo.includes('PROFESOR') ? (this.rol = 4) : (this.rol = 2);
        this.cargo = accionPersonal.apeCargo;
        this.dependencia = accionPersonal.apeDepedenciaEspecifica;
      }
    }

    this.frmRegistro.patchValue({
      cargo: this.cargo,
      dependencia: this.dependencia,
      rolId: this.rol,
    });
  };

  getFoto = async (usuario: any) => {
    const { per_id } = usuario;
    console.log('per_id: ', per_id);
    const { imgArchivo } = await this.swUser.getFotoTTHHASYNC(per_id);
    console.log('imgArchivo: ', imgArchivo);
    this.base64textString = imgArchivo ?? this.base64textString;
  };

  obtenerDataAcademico = async (usuario: any) => {
    let cedula = usuario.cedula.slice(0, 9) + '-' + usuario.cedula.slice(9, 10);
    const { listado } = await this.swUser.getInformacionEstudianteSYNC(cedula);
    if (listado.length == 0) {
      const { listado: listadoPostgrado } =
        await this.swUser.validarMatriculaVigentePostGradoSYNC(usuario.cedula);
      if (listadoPostgrado.length == 0) {
        return;
      }

      if (listadoPostgrado[0].graduado) {
        return;
      }
      this.getFoto(usuario);
      this.frmRegistro.patchValue({
        cargo: 'ESTUDIANTE',
        dependencia: 'POSTGRADO',
      });
      // this.conexion.set();
      this.rol = 3;

      return;
    }

    this.base64textString = `${listado[0].strfoto ?? this.base64textString}`;
    const { listado: listadoAcademico } =
      await this.swUser.validarMatriculaVigenteSYNC(cedula);
    this.frmRegistro.patchValue({
      cargo: 'ESTUDIANTE',
      dependencia: listadoAcademico[0].carreraSelecionadaFacultad,
    });
  };

  guardar = () => {
    this.frmRegistro.patchValue({
      roles: [
        {
          intPersona: this.dataEnrol.per_id,
          intRol: this.rol,
          intDepencia: 1,
          strDepencia: this.strDependencia!.value,
          strCargo: this.strCargo!.value,
          intEstado: 1,
        },
      ],
    });

    const intIdPersona = this.intIdPersona!.value;
    let strCedula = this.strCedula!.value;
    const strNombres = this.strNombres!.value;
    const strApellidos = this.strApellidos!.value;
    const strCorreo = this.strCorreo!.value;
    const strDependencia = this.strDependencia!.value;
    const strCargo = this.strCargo!.value;
    strCedula = strCedula.replace('-', '');
    const json = {
      ...this.frmRegistro.value,
      intIdPersona,
      strCedula,
      strNombres,
      strApellidos,
      strCorreo,
      strDependencia,
      strCargo,
      conexion: this.conexion(),
    };

    this.swUser.postRegistroEnrol(json).subscribe((objEnrol) => {
      console.log('objEnrol: ', objEnrol);
      if (objEnrol.count > 0) {
        this.alerty.add({
          severity: 'success',
          summary: 'Enrolamiento',
          detail: 'Enrolamiento exitoso',
        });
        this.enrolado = true;
        // this.r;
      } else {
        console.log('sin matricula  ');

        this.sinMatricula = true;
        this.alerty.add({
          severity: 'error',
          summary: 'Enrolamiento fallido',
          detail: objEnrol.message,
        });
      }
    });
  };

  formBuilder = (datos: any) => {
    this.frmRegistro = this.fb.group({
      intIdPersona: [datos.per_id],
      strCedula: [datos.cedula],
      strNombres: [datos.nombres],
      strApellidos: [datos.apellidos],
      strCorreo: [datos.per_email],
      strTelefono: [''],
      cargo: [this.cargo],
      dependencia: [this.dependencia],
      intEstado: [1],
      intIdTermino: [1],
      intAceptado: [1],
      rolId: this.rol,
      roles: [''],
    });

    this.intIdPersona?.disable();
    this.strCedula?.disable();
    this.strNombres?.disable();
    this.strApellidos?.disable();
    this.strCargo?.disable();
    this.strDependencia?.disable();
  };
  login = () => {
    this.router.navigate(['/dashboard/users']);
  };

  atras = () => {
    this.router.navigate(['/']);
  };

  get intIdPersona() {
    return this.frmRegistro.get('intIdPersona');
  }

  get strCedula() {
    return this.frmRegistro.get('strCedula');
  }
  get strCorreo() {
    return this.frmRegistro.get('strCorreo');
  }
  get strNombres() {
    return this.frmRegistro.get('strNombres');
  }
  get strApellidos() {
    return this.frmRegistro.get('strApellidos');
  }
  get strCargo() {
    return this.frmRegistro.get('cargo');
  }
  get strDependencia() {
    return this.frmRegistro.get('dependencia');
  }
}
