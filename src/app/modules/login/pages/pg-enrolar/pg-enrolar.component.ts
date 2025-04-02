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
  tokenTTHH: string = '';
  rol: number = 2;
  ngOnInit() {
    this.dataEnrol = this.swCas.getUserInfo();
    // if (!this.dataEnrol.per_id) {
    //   this.alerty.add({
    //     severity: 'error',
    //     summary: 'Enrolamiento fallido',
    //     detail: 'Por favor inicie sesion y vuelva a ingresar al link',
    //   });
    //   setTimeout(() => {
    //     this.swCas.logoutLocal();
    //     this.router.navigate(['/']);
    //     return;
    //   }, 1500);
    // }
    this.obtenerToken();

    this.formBuilder(this.dataEnrol);
  }

  obtenerToken = () => {
    this.swUser.getAccesoTokenTTHH().subscribe((res) => {
      this.tokenTTHH = res.token;
      this.getCargos(this.dataEnrol);
    });
  };

  getCargos = (usuario: any) => {
    this.swUser
      .getCargoDependenciaTTHH(usuario.cedula, this.tokenTTHH)
      .subscribe((res) => {
        if (res.success) {
          const { contrato } = res.data!;
          const { accionPersonal } = res.data!;

          this.getFoto(usuario);
          if (contrato) {
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

          // this.cargo = res.data?.accionPersonal?.apeCargo;
          // this.dependencia = res.data?.accionPersonal?.apeDepedenciaGeneral;
          this.frmRegistro.patchValue({
            cargo: this.cargo,
            dependencia: this.dependencia,
            rolId: 2,
          });
        } else {
          this.rol = 3;

          this.obtenerDataAcademico(usuario);
        }
      });
  };

  getFoto = (usuario: any) => {
    this.swUser.getFotoTTHH(usuario.per_id).subscribe((objImg) => {
      this.base64textString = objImg.imgArchivo;
    });
  };

  obtenerDataAcademico = (usuario: any) => {
    let cedula = usuario.cedula.slice(0, 9) + '-' + usuario.cedula.slice(9, 10);
    this.swUser.getInformacionEstudiante(cedula).subscribe((objAcademico) => {
      try {
        this.base64textString = `${objAcademico.listado[0].strfoto || ''}`;
      } catch (error) {
        console.log('error: ', error);
      }
      let estudiante = objAcademico.listado[0];

      this.swUser.validarMatriculaVigente(cedula).subscribe({
        next: (res) => {
          this.frmRegistro.patchValue({
            intIdPersona: this.dataEnrol.per_id,
            strCedula: this.dataEnrol.cedula,
            strNombres: this.dataEnrol.nombres,
            strApellidos: this.dataEnrol.apellidos,
            strCorreo: this.dataEnrol.per_email,
            strTelefono: '',
            cargo: 'ESTUDIANTE',
            dependencia:
              res.listado[0].carreraSeleccionada +
              ' / ' +
              res.listado[0].carreraSelecionadaFacultad,
            intEstado: 1,
            intIdTermino: 1,
            intAceptado: 1,
            rolId: this.rol,
            roles: [''],
          });
          this.conexion.set(res.listado[0].carreraSelecionadaBase);
        },
      });
    });
  };

  guardar = () => {
    this.frmRegistro.patchValue({
      roles: [
        {
          intPersona: this.dataEnrol.per_id,
          intRol: this.rol,
          intDepencia: 1,
          strDepencia: this.dependencia,
          strCargo: this.cargo,
          intEstado: 1,
        },
      ],
    });

    const intIdPersona = this.frmRegistro.get('intIdPersona')!.value;
    let strCedula = this.frmRegistro.get('strCedula')!.value;
    const strNombres = this.frmRegistro.get('strNombres')!.value;
    const strApellidos = this.frmRegistro.get('strApellidos')!.value;
    const strCorreo = this.frmRegistro.get('strCorreo')!.value;
    const strDependencia = this.frmRegistro.get('dependencia')!.value;
    const strCargo = this.frmRegistro.get('cargo')!.value;
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
      intIdPersona: [{ value: datos.per_id, disabled: true }],
      strCedula: [{ value: datos.cedula, disabled: true }],
      strNombres: [{ value: datos.nombres, disabled: true }],
      strApellidos: [{ value: datos.apellidos, disabled: true }],
      strCorreo: [{ value: datos.per_email, disabled: false }],
      strTelefono: [''],
      cargo: [{ value: this.cargo, disabled: true }],
      dependencia: [{ value: this.dependencia, disabled: true }],
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
}
