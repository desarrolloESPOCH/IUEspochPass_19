// cspell:disable
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable, catchError, of, switchMap } from 'rxjs';

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
  estadoTexto?: 'ACTIVO' | 'DESACTIVADO';
}

export interface IInvitadoAdmin {
  intPersona: number;
  strCedula: string;
  strNombres: string;
  strApellidos: string;
  strCorreo?: string;
  strTelefono?: string;
  intRol: number;
  rol: string;
  strCargo: string;
  strDepencia: string;
  estadoInvitado: number;
  intIdCarnet?: number;
  dtFecha_Inicio?: string;
  dtFecha_Fin?: string;
  estadoCarnet?: number;
  estadoVigencia: 'ACTIVO' | 'VENCIDO' | 'DESACTIVADO' | 'SIN_CARNET';
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

  getPersonaCarnet(cedula: string, soloLocal: boolean = false): Observable<any> {
    const cedulaLimpia = cedula.replace(/-/g, '');
    let params = new HttpParams();
    if (soloLocal) {
      params = params.set('soloLocal', 'true');
    }
    return this.http.get<any>(
      `${this.URLSERVICIO}/admin/carnet/persona/${cedulaLimpia}`,
      { params }
    );
  }

  obtenerPersonaCentralizada(cedula: string): Observable<any> {
    const cedulaLimpia = (cedula || '').replace(/[\s-]/g, '').replace(/['"]/g, '').trim();
    return this.http.get<any>(
      `https://centralizada2.espoch.edu.ec/rutadinardap/obtenerpersona/${cedulaLimpia}`
    ).pipe(
      catchError(() => of(null)),
      switchMap((res) => {
        if (res && typeof res === 'object' && ('success' in res || 'listado' in res)) {
          return of(res);
        }
        return this.http.get<any>(
          `${this.URLSERVICIO}/admin/centralizada/persona/${cedulaLimpia}`
        );
      })
    );
  }

  cambiarEstado(intIdCarnet: number, intEstado: number, adminInfo?: any): Observable<any> {
    return this.http.put<any>(
      `${this.URLSERVICIO}/admin/carnet/cambiar_estado`,
      { intIdCarnet, intEstado, adminInfo }
    );
  }

  renovarActivar(data: {
    intIdCarnet?: number;
    intIdPersona?: number;
    strCedula?: string;
    dtFechaFin?: string;
    mesesProrroga?: number;
    adminInfo?: any;
  }): Observable<any> {
    return this.http.post<any>(
      `${this.URLSERVICIO}/admin/carnet/renovar_activar`,
      data
    );
  }

  actualizarRolDependencia(data: {
    intPersona: number;
    strCedula?: string;
    intRol: number;
    strDepencia: string;
    strCargo?: string;
    intDepencia?: number;
    adminInfo?: any;
  }): Observable<any> {
    return this.http.put<any>(
      `${this.URLSERVICIO}/admin/persona/rol_dependencia`,
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

  // Métodos de Invitados (Bares / Proveedores)
  getInvitados(paramsObj: any = {}): Observable<{ count: number; message: string; data: IInvitadoAdmin[] }> {
    let params = new HttpParams();
    Object.keys(paramsObj).forEach((key) => {
      if (paramsObj[key] !== null && paramsObj[key] !== undefined && paramsObj[key] !== '') {
        params = params.set(key, paramsObj[key]);
      }
    });
    return this.http.get<{ count: number; message: string; data: IInvitadoAdmin[] }>(
      `${this.URLSERVICIO}/admin/invitados`,
      { params }
    );
  }

  cambiarEstadoInvitado(intPersona: number, intEstado: number, adminInfo?: any): Observable<any> {
    return this.http.put<any>(
      `${this.URLSERVICIO}/admin/invitado/cambiar_estado`,
      { intPersona, intEstado, adminInfo }
    );
  }

  agregarInvitado(body: {
    strCedula: string;
    strNombres?: string;
    strApellidos?: string;
    strCorreo?: string;
    strTelefono?: string;
    strDepencia?: string;
    strCargo?: string;
    mesesVigencia?: number;
    adminInfo?: any;
  }): Observable<any> {
    return this.http.post<any>(
      `${this.URLSERVICIO}/admin/invitado/agregar`,
      body
    );
  }

  cargaMasivaInvitados(payload: {
    lista: any[];
    mesesVigencia?: number;
    adminInfo?: any;
  }): Observable<any> {
    return this.http.post<any>(
      `${this.URLSERVICIO}/admin/invitado/carga_masiva`,
      payload
    );
  }
}

