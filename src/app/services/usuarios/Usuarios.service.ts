// cspell: disable;
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { IResponse } from './interfaces/IResponse.interface';
import { IMenu } from './interfaces/IMenu.interface';
import { IUser } from './interfaces/Iuser';
import { IimagenEmpleado } from './interfaces/IEmpleadoImg';
import { TalentoHumano } from './interfaces/ITalentoHumano';
import { IEstudianteConfirma } from './interfaces/IEstudiante';
import { IRol } from './interfaces/IRol.interface';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class swUsuariosService {
  private serviceUser = inject(HttpClient);
  private __http = inject(HttpClient);
  private URLSERVICIO = environment.SERVICIO_WEB;
  constructor() {}

  getMenu = (idRol: number) => {
    return this.serviceUser.get<IResponse<IMenu>>(
      `${this.URLSERVICIO}/admin/menu/${idRol}`,
      {
        headers: new HttpHeaders({
          'Content-Type': 'application/json; charset=utf-8',
        }),
      }
    );
  };

  validateRoles(usuario: number) {
    const validationUrl = `${this.URLSERVICIO}/seguridad/user/${usuario}`;
    return this.serviceUser.get<IResponse<IUser>>(validationUrl);
  }
  //RETORNA SOLO LA FOTO DE LA HOJA DE VIDA DE TTHH
  getFotoTTHH(usuario: string) {
    const validationUrl = `${environment.FOTO_TTHH}/${usuario}`;
    return this.serviceUser.get<IimagenEmpleado>(validationUrl);
  }
  //OBTENER EL TOKEN PARA EL CONSUMO DE SERVICIOS DE TTHH
  getAccesoTokenTTHH = () => {
    const vecPersona = {
      usuSerId: 26,
      usuPassword: '0604508390',
    };
    return this.serviceUser.post<any>(
      `${environment.RUTA_TOKEN_TTHH}`,
      vecPersona,
      {
        headers: new HttpHeaders({
          'Content-Type': 'application/json; charset=utf-8',
        }),
      }
    );
  };
  //RETORNA INFORMACIÓN DE UN EMPLEADO
  getCargoDependenciaTTHH = (cedula: string, claveServicio: any) => {
    let vecPersona = {
      perCedula: cedula,
    };

    return this.serviceUser.post<TalentoHumano>(
      `${environment.CARGO_DEPENCENCIA}`,
      vecPersona,
      {
        headers: new HttpHeaders({
          Authorization: 'Bearer ' + claveServicio,
          'Content-Type': 'application/json; charset=utf-8',
        }),
      }
    );
  };

  //GUARDAR EL ENROLAMIENTO DEL USUARIO
  postRegistroEnrol = (dataRol: any) => {
    return this.serviceUser.post<IResponse<[]>>(
      `${this.URLSERVICIO}/carnet/user_carnet`,
      dataRol,
      {
        headers: new HttpHeaders({
          'Content-Type': 'application/json; charset=utf-8',
        }),
      }
    );
  };
  //DEVUELVE LA INFORMACION DE UN ESTUDIANTE DADO SU CEDULA
  getInformacionEstudiante(usuario: string) {
    const validationUrl = `${environment.FOTO_ACADEMICO}/${usuario}`;
    return this.serviceUser.get<IEstudianteConfirma>(validationUrl, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json; charset=utf-8',
      }),
    });
  }

  getRolesByUser = (per_id: number) => {
    return this.serviceUser.get<IResponse<IRol>>(
      `${this.URLSERVICIO}/seguridad/user_roles/${per_id}`,
      {
        headers: new HttpHeaders({
          'Content-Type': 'application/json; charset=utf-8',
        }),
      }
    );
  };

  getUsers = () => {
    return this.__http.get<IResponse<IUser>>(
      `${this.URLSERVICIO}/seguridad/users`,
      {
        headers: new HttpHeaders({
          'Content-Type': 'application/json; charset=utf-8',
        }),
      }
    );
  };
  putUser = (user: IUser) => {
    return this.__http.put<IResponse<IUser>>(
      `${this.URLSERVICIO}/seguridad/user`,
      user,
      {
        headers: new HttpHeaders({
          'Content-Type': 'application/json; charset=utf-8',
        }),
      }
    );
  };
  postUser = (user: IUser) => {
    return this.__http.post(`${this.URLSERVICIO}/seguridad/user`, user);
  };
  deleteUser = (per_id: string) => {
    return this.__http.delete(`${this.URLSERVICIO}/seguridad/user/${per_id}`);
  };

  getAllRoles = () => {
    return this.__http.get<IResponse<IRol>>(`${this.URLSERVICIO}/admin/roles`);
  };

  putRoles = (json: any) => {
    return this.__http.put(`${this.URLSERVICIO}/seguridad/roles_persona`, json);
  };

  validarMatriculaVigente = (cedula: string) => {
    return this.__http.get<IResponseRuben>(
      `https://apisai.espoch.edu.ec/rutaAcademicoCarrera/matriculaestudianteperiodovigente/${cedula}`
    );
  };
}

export interface Matricula {
  sintCodigo: number;
  strCodPeriodo: string;
  strCodEstud: string;
  strCodNivel: string;
  dtFechaCreada: string;
  strCodEstado: string;
  strCedula: string;
}

export interface Listado {
  carreraSelecionadaCodigo: string;
  carreraSeleccionada: string;
  carreraSelecionadaBase: string;
  carreraSelecionadaCodigoUnica: string;
  carreraSelecionadaFacultadCodigo: string;
  carreraSelecionadaFacultad: string;
  matricula: Matricula;
}

export interface IResponseRuben {
  success: boolean;
  listado: Listado[];
}
