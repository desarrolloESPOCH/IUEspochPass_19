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
  totalCarnetsUsuario?: number;
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

export interface IHistorialAcceso {
  intIdRegistro: number;
  intQR?: number;
  fechaRegistro: string;
  strUsuarioRegitro: string;
  intTipoRegistro: number;
  tipoRegistroTexto: 'ENTRADA' | 'SALIDA' | 'CONTROL';
  estadoAcceso: number;
  estadoAccesoTexto: 'VÁLIDO' | 'NO VÁLIDO';
  strMotivoRechazo: string;
  strCodigoLeido?: string;
  // Dueño del QR
  idDueno?: number;
  cedulaDueno: string;
  nombreDueno: string;
  correoDueno?: string;
  telefonoDueno?: string;
  rolDueno: string;
  dependenciaDueno: string;
  cargoDueno: string;
  // Guardia / Operador
  idGuardia?: number;
  cedulaGuardia: string;
  nombreGuardia: string;
}

export interface IResumenHistorial {
  total: number;
  totalValidos: number;
  totalInvalidos: number;
  totalHoy: number;
}

export interface IHistorialResponse {
  count: number;
  totales: IResumenHistorial;
  page: number;
  limit: number;
  data: IHistorialAcceso[];
}

export interface IAuditoriaLog {
  intIdAuditoria: number;
  dtFecha: string;
  strAccion: string;
  strCedulaUsuario: string;
  intIdPersona?: number;
  nombreUsuarioAfectado: string;
  strCedulaAdmin: string;
  strNombresAdmin: string;
  intIdAdmin?: number;
  strDetalle: string;
}

export interface IResumenAuditoria {
  total: number;
  totalHoy: number;
  totalCarnets: number;
  totalRoles: number;
  totalPersonas: number;
}

export interface IAuditoriaResponse {
  count: number;
  totales: IResumenAuditoria;
  page: number;
  limit: number;
  data: IAuditoriaLog[];
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

  getCarnetsPorPersona(idPersona: number | string): Observable<{ count: number; message: string; data: any[] }> {
    return this.http.get<{ count: number; message: string; data: any[] }>(
      `${this.URLSERVICIO}/admin/persona/${idPersona}/carnets`
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
    intRol?: number;
    roles?: number[];
    intRoles?: number[];
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

  cambiarEstadoGuardia(intPersona: number, intEstado: number, adminInfo?: any): Observable<any> {
    return this.http.put<any>(
      `${this.URLSERVICIO}/admin/guardia/cambiar_estado`,
      { intPersona, intEstado, adminInfo }
    );
  }

  agregarGuardia(body: { strCedula: string; strNombres?: string; strApellidos?: string; strCorreo?: string; strTelefono?: string; adminInfo?: any }): Observable<any> {
    return this.http.post<any>(
      `${this.URLSERVICIO}/admin/guardia/agregar`,
      body
    );
  }


  cargaMasivaGuardias(payload: {
    lista: any[];
    adminInfo?: any;
  }): Observable<any> {
    return this.http.post<any>(
      `${this.URLSERVICIO}/admin/guardia/carga_masiva`,
      payload
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

  // ==========================================
  // HISTORIAL DE ACCESOS Y EXPORTACIÓN A EXCEL
  // ==========================================

  getHistorialAccesos(paramsObj: any = {}): Observable<IHistorialResponse> {
    let params = new HttpParams();
    Object.keys(paramsObj).forEach((key) => {
      if (paramsObj[key] !== null && paramsObj[key] !== undefined && paramsObj[key] !== '') {
        params = params.set(key, paramsObj[key]);
      }
    });
    return this.http.get<IHistorialResponse>(
      `${this.URLSERVICIO}/admin/historial-accesos`,
      { params }
    );
  }

  registrarAccesoInvalido(body: {
    intIdQr?: any;
    strUsuarioRegitro: string;
    intTipoRegistro?: number;
    strMotivoRechazo: string;
    strCodigoLeido?: string;
  }): Observable<any> {
    return this.http.post<any>(
      `${this.URLSERVICIO}/admin/registro-acceso-invalido`,
      body
    );
  }

  exportarExcelAccesos(datos: IHistorialAcceso[], nombreArchivo: string = 'Historial_Accesos_ESPOCH'): void {
    import('xlsx').then((xlsx) => {
      const dataFormateada = datos.map((d, index) => ({
        '#': index + 1,
        'Fecha y Hora': d.fechaRegistro || 'N/A',
        'Tipo Movimiento': d.tipoRegistroTexto || 'ENTRADA',
        'Estado': d.estadoAccesoTexto || (d.estadoAcceso === 1 ? 'VÁLIDO' : 'NO VÁLIDO'),
        'Motivo / Observación': d.strMotivoRechazo || '',
        'Cédula Usuario': d.cedulaDueno || 'N/A',
        'Nombre del Usuario': d.nombreDueno || 'Desconocido',
        'Rol': d.rolDueno || 'SIN ROL',
        'Dependencia / Carrera': d.dependenciaDueno || 'N/A',
        'Cargo': d.cargoDueno || 'N/A',
        'Cédula Guardia': d.cedulaGuardia || '',
        'Guardia / Lector': d.nombreGuardia || 'SISTEMA',
      }));

      const worksheet = xlsx.utils.json_to_sheet(dataFormateada);
      const workbook = { Sheets: { 'Accesos': worksheet }, SheetNames: ['Accesos'] };
      const excelBuffer: any = xlsx.write(workbook, { bookType: 'xlsx', type: 'array' });
      
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${nombreArchivo}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    });
  }

  // ==========================================
  // LOGS DE AUDITORÍA Y ACTIVIDAD ADMINISTRATIVA
  // ==========================================

  getAuditorias(paramsObj: any = {}): Observable<IAuditoriaResponse> {
    let params = new HttpParams();
    Object.keys(paramsObj).forEach((key) => {
      if (paramsObj[key] !== null && paramsObj[key] !== undefined && paramsObj[key] !== '') {
        params = params.set(key, paramsObj[key]);
      }
    });
    return this.http.get<IAuditoriaResponse>(
      `${this.URLSERVICIO}/admin/auditorias`,
      { params }
    );
  }

  exportarExcelAuditorias(datos: IAuditoriaLog[], nombreArchivo: string = 'Auditoria_Logs_ESPOCH'): void {
    import('xlsx').then((xlsx) => {
      const dataFormateada = datos.map((d, index) => ({
        '#': index + 1,
        'Fecha y Hora': d.dtFecha || 'N/A',
        'Acción Realizada': d.strAccion || 'N/A',
        'Usuario Responsable (Admin)': d.strNombresAdmin || 'ADMINISTRADOR',
        'Cédula Admin': d.strCedulaAdmin || 'N/A',
        'Usuario Afectado': d.nombreUsuarioAfectado || 'N/A',
        'Cédula Usuario': d.strCedulaUsuario || 'N/A',
        'Detalle del Cambio': d.strDetalle || '',
      }));

      const worksheet = xlsx.utils.json_to_sheet(dataFormateada);
      const workbook = { Sheets: { 'Auditoría': worksheet }, SheetNames: ['Auditoría'] };
      const excelBuffer: any = xlsx.write(workbook, { bookType: 'xlsx', type: 'array' });
      
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${nombreArchivo}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    });
  }

  // ==========================================
  // CAMBIO DE CONTRASEÑA
  // ==========================================

  cambiarPassword(body: {
    strCedula: string;
    nuevaClave?: string;
    strCorreo?: string;
    strNombres?: string;
    rol?: string;
    notificarCorreo?: boolean;
    adminInfo?: any;
  }): Observable<any> {
    return this.http.post<any>(
      `${this.URLSERVICIO}/admin/usuario/cambiar_password`,
      body
    );
  }
}



