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
import { IRol } from '../../interface/IRol.interface';
import { obtenerToken } from '../../../../utils/tthh/tokens';

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

  isloading = signal(false);

  public base64textString = signal<string>('');
  public dataEnrol: any;

  conexion = signal('');
  public enrolado: Boolean = false;
  public sinMatricula: Boolean = false;

  frmRegistro: FormGroup = {} as FormGroup;
  rol: number = 2;

  async ngOnInit() {
    this.isloading.set(false);
    this.dataEnrol = this.swCas.getUserInfo();
    console.log('this.dataEnrol : ', this.dataEnrol);

    if (!this.dataEnrol.per_id) {
      console.log('No se loguea aun');
      this.atras();
      return;
    }
    this.formBuilder(this.dataEnrol);
    await this.getCargos(this.dataEnrol);
    this.isloading.set(true);
  }

  IsDocenteOrFuncionario = (data: any) => {
    let cargo = '';
    let dependencia = '';
    const { contrato, accionPersonal } = data;

    if (contrato) {
      // console.log('aqui: ');
      const { conCargo } = contrato;
      if (conCargo) {
        conCargo.includes('PROFESOR') ? (this.rol = 4) : (this.rol = 2);
        cargo = contrato.conCargo;
        dependencia = contrato.conDependenciaEspecifica;
      }
      return { cargo, dependencia };
    }

    const { apeCargo } = accionPersonal;

    apeCargo.includes('PROFESOR') ? (this.rol = 4) : (this.rol = 2);
    cargo = accionPersonal.apeCargo;
    dependencia = accionPersonal.apeDepedenciaEspecifica;
    return { cargo, dependencia };
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

    const token = await obtenerToken(this.swUser);

    if (!token) return;

    const { success, data } = await this.swUser.getCargoDependenciaTTHH_SYNC(
      cedula,
      token
    );
    if (!success) {
      this.rol = 3;
      await this.obtenerDataAcademico(usuario);
      return;
    }
    await this.getFoto(usuario);
    const { cargo, dependencia } = await this.IsDocenteOrFuncionario(data);

    this.frmRegistro.patchValue({
      cargo: cargo,
      dependencia: dependencia,
      rolId: this.rol,
    });
  };

  getFoto = async (usuario: any) => {
    const { per_id } = usuario;
    const { imgArchivo } = await this.swUser.getFotoTTHHASYNC(per_id);
    this.base64textString.set(imgArchivo ?? this.base64textString());
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

    this.base64textString.set(`${listado[0].strfoto ?? this.base64textString}`);
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
    console.log('json', json);
    this.swUser.postRegistroEnrol(json).subscribe((objEnrol) => {
      console.log('objEnrol: ', objEnrol);
      // if (objEnrol.count > 0) {
      this.alerty.add({
        severity: 'success',
        summary: 'Enrolamiento',
        detail: 'Enrolamiento exitoso',
      });
      this.enrolado = true;

      // this.r;
      // } else {
      // console.log('sin matricula  ');

      // this.sinMatricula = true;
      // this.alerty.add({
      //   severity: 'error',
      //   summary: 'Enrolamiento fallido',
      //   detail: objEnrol.message,
      // });
      // }
    });
  };

  formBuilder = (datos: any) => {
    this.frmRegistro = this.fb.group({
      intIdPersona: [{ value: datos.per_id, disabled: true }],
      strCedula: [{ value: datos.cedula, disabled: true }],
      strNombres: [{ value: datos.nombres, disabled: true }],
      strApellidos: [{ value: datos.apellidos, disabled: true }],
      strCorreo: [{ value: datos.per_email, disabled: false }], // Este campo queda editable, cambia a true si quieres bloquearlo
      strTelefono: [''],
      cargo: [{ value: '', disabled: true }],
      dependencia: [{ value: '', disabled: true }],
      intEstado: [1],
      intIdTermino: [1],
      intAceptado: [1],
      rolId: this.rol,
      roles: [''],
    });
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
