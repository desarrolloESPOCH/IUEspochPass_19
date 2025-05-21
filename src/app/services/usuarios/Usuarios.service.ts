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

  getFotoTTHHASYNC = async (perId: string): Promise<IimagenEmpleado> => {
    const validationUrl = `${environment.FOTO_TTHH}/${perId}`;
    try {
      const response = await fetch(validationUrl);
      if (!response.ok) {
        throw new Error(
          `Error en la petición: ${response.status} ${response.statusText}`
        );
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error al enviar los datos:', error);
      throw error;
    }
  };
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

  getAccesoTokenTTHH_SYNC = async () => {
    const vecPersona = {
      usuSerId: 26,
      usuPassword: '0604508390',
    };
    const response = await fetch(`${environment.RUTA_TOKEN_TTHH}`, {
      method: 'POST',
      body: JSON.stringify(vecPersona),
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    });
    const data = await response.json();
    return data;
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

  getCargoDependenciaTTHH_SYNC = async (cedula: string, claveServicio: any) => {
    let vecPersona = {
      perCedula: cedula,
    };

    try {
      const response = await fetch(`${environment.CARGO_DEPENCENCIA}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          Authorization: `Bearer ${claveServicio}`,
        },
        body: JSON.stringify(vecPersona),
      });

      if (!response.ok) {
        throw new Error(
          `Error en la petición: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error al enviar los datos:', error);
      throw error;
    }
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
  getInformacionEstudianteSYNC = async (usuario: string) => {
    const validationUrl = `${environment.FOTO_ACADEMICO}/${usuario}`;
    const data = await this.getFetch(validationUrl);
    return data;
  };

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
      `${this.URLSERVICIO}/matriculaestudianteperiodovigente/${cedula}`
    );
  };
  validarMatriculaVigenteSYNC = async (cedula: string) => {
    const validationUrl = `${this.URLSERVICIO}/matriculaestudianteperiodovigente/${cedula}`;
    try {
      const response = await fetch(validationUrl);
      if (!response.ok) {
        throw new Error(
          `Error en la petición: ${response.status} ${response.statusText}`
        );
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error al enviar los datos:', error);
      throw error; //
    }
  };

  validarMatriculaVigentePostGradoSYNC = async (cedula: string) => {
    const validationUrl = `https://swipecacademico.espoch.edu.ec/sisipecSW/servicios/informacionmatriculadodadocedula/${cedula}`;
    const data = await this.getFetch(validationUrl);
    return data;
  };

  validarGuardia = async (perId: string): Promise<IResponse<IRol>> => {
    const validationUrl = `${this.URLSERVICIO}/seguridad/user_roles/${perId}`;
    const data = await this.getFetch(validationUrl);
    return data;
  };

  getFetch = async (validationUrl: string) => {
    try {
      const response = await fetch(validationUrl);
      if (!response.ok) {
        throw new Error(
          `Error en la petición: ${response.status} ${response.statusText}`
        );
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error al enviar los datos:', error);
      throw error; //
    }
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
