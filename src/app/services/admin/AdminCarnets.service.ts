// cspell:disable
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

export interface ICarnetAdmin {
  intIdCarnet: number;
  intUsuario: number;
  strCedula: string;
  strNombres: string;
  strApellidos: string;
  strCorreo: string;
  strTelefono: string;
  dtFecha_Inicio: string;
  dtFecha_Fin: string;
  estadoCarnet: number;
  intIdRol: number;
  rol: string;
  strCargo: string;
  strDepencia: string;
  estadoVigencia: 'ACTIVO' | 'VENCIDO' | 'DESACTIVADO';
}

export interface IEstadisticasCarnet {
  resumen: {
    totalCarnets: number;
    carnetsActivos: number;
    carnetsVencidos: number;
    carnetsDesactivados: number;
  };
  distribucionRol: {
    rol: string;
    total: number;
  }[];
}

export interface IResponseList<T> {
  count: number;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  message: string;
  data: T[];
}

export interface IGuardiaAdmin {
  intPersona: number;
  strCedula: string;
  strNombres: string;
  strApellidos: string;
  strCorreo: string;
  strTelefono: string;
  intRol: number;
  rol: string;
  strCargo: string;
  strDepencia: string;
  estadoGuardia: number;
  intIdCarnet?: number;
  dtFecha_Inicio?: string;
  dtFecha_Fin?: string;
  estadoCarnet?: number;
  estadoTexto: 'ACTIVO' | 'DESACTIVADO';
}

@Injectable({
  providedIn: 'root',
})
export class AdminCarnetsService {
  private http = inject(HttpClient);
  private URLSERVICIO = environment.SERVICIO_WEB;

  getCarnets(paramsObj: any = {}): Observable<IResponseList<ICarnetAdmin>> {
    let params = new HttpParams();
    Object.keys(paramsObj).forEach((key) => {
      if (paramsObj[key] !== null && paramsObj[key] !== undefined && paramsObj[key] !== '') {
        params = params.set(key, paramsObj[key]);
      }
    });
    return this.http.get<IResponseList<ICarnetAdmin>>(
      `${this.URLSERVICIO}/admin/carnets`,
      { params }
    );
  }

  getEstadisticas(): Observable<{ count: number; message: string; data: IEstadisticasCarnet }> {
    return this.http.get<{ count: number; message: string; data: IEstadisticasCarnet }>(
      `${this.URLSERVICIO}/admin/carnets/estadisticas`
    );
  }

  getPersonaCarnet(cedula: string): Observable<any> {
    const cedulaLimpia = cedula.replace(/-/g, '');
    return this.http.get<any>(
      `${this.URLSERVICIO}/admin/carnet/persona/${cedulaLimpia}`
    );
  }

  cambiarEstado(intIdCarnet: number, intEstado: number): Observable<any> {
    return this.http.put<any>(
      `${this.URLSERVICIO}/admin/carnet/cambiar_estado`,
      { intIdCarnet, intEstado }
    );
  }

  renovarActivar(data: {
    intIdCarnet?: number;
    intIdPersona?: number;
    strCedula?: string;
    dtFechaFin?: string;
    mesesProrroga?: number;
  }): Observable<any> {
    return this.http.post<any>(
      `${this.URLSERVICIO}/admin/carnet/renovar_activar`,
      data
    );
  }

  getRoles(): Observable<any> {
    return this.http.get<any>(`${this.URLSERVICIO}/admin/roles`);
  }

  getGuardias(paramsObj: any = {}): Observable<{ count: number; message: string; data: IGuardiaAdmin[] }> {
    let params = new HttpParams();
    Object.keys(paramsObj).forEach((key) => {
      if (paramsObj[key] !== null && paramsObj[key] !== undefined && paramsObj[key] !== '') {
        params = params.set(key, paramsObj[key]);
      }
    });
    return this.http.get<{ count: number; message: string; data: IGuardiaAdmin[] }>(
      `${this.URLSERVICIO}/admin/guardias`,
      { params }
    );
  }

  cambiarEstadoGuardia(intPersona: number, intEstado: number): Observable<any> {
    return this.http.put<any>(
      `${this.URLSERVICIO}/admin/guardia/cambiar_estado`,
      { intPersona, intEstado }
    );
  }

  agregarGuardia(body: { strCedula: string; strNombres?: string; strApellidos?: string; strCorreo?: string; strTelefono?: string }): Observable<any> {
    return this.http.post<any>(
      `${this.URLSERVICIO}/admin/guardia/agregar`,
      body
    );
  }
}
