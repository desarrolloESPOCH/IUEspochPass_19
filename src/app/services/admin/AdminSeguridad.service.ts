// cspell:disable
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, of, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface IPersonaAdmin {
  intIdPersona?: number;
  strCedula: string;
  strNombres: string;
  strApellidos: string;
  strCorreo?: string;
  strTelefono?: string;
  intEstado: number;
  strDepencia?: string;
  strCargo?: string;
  roles?: {
    intIdRol: number;
    strNombre: string;
    strDepencia?: string;
    strCargo?: string;
  }[];
  rolesIds?: number[];
  rol?: string;
  origen?: 'local' | 'centralizada' | 'nuevo';
}

export interface IRolAdmin {
  intIdRol: number;
  strNombre: string;
  strDescripcion: string;
  strIcono?: string;
  intEstado: number;
  fecha?: string;
}

export interface IPadreOpcion {
  intPadreOpcion: number;
  strNombre: string;
  strIcono?: string;
  intOrden: number;
  intEstado: number;
  strUrl?: string;
}

export interface IOpcion {
  intIdOpcion: number;
  strNombre: string;
  strDescripcion?: string;
  strUrl?: string;
  strMetodo?: string;
  strIcono?: string;
  intOrden: number;
  intEstado: number;
}

export interface IRolOpcion {
  intRol?: number;
  intOpcion: number;
  intPadreOpcion: number;
  bitInsertar: boolean | number;
  bitModificar: boolean | number;
  bitEliminar: boolean | number;
  intEstado: number | boolean;
  strPadre?: string;
  strIconoPadre?: string;
  strOpcion?: string;
  strDescripcionOpcion?: string;
  strIconoOpcion?: string;
  strMetodoOpcion?: string;
  strUrlOpcion?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AdminSeguridadService {
  private http = inject(HttpClient);
  private URLSERVICIO = environment.SERVICIO_WEB;

  // ==========================================
  // GESTIÓN DE PERSONAS Y USUARIOS
  // ==========================================

  getUsuarios(): Observable<{ count: number; message: string; data: IPersonaAdmin[] }> {
    return this.http.get<{ count: number; message: string; data: IPersonaAdmin[] }>(
      `${this.URLSERVICIO}/seguridad/users`
    );
  }

  getPersonaPorId(id: number | string): Observable<any> {
    return this.http.get<any>(`${this.URLSERVICIO}/seguridad/user/${id}`);
  }

  consultarPersonaLocal(cedula: string): Observable<any> {
    const cedulaLimpia = (cedula || '').replace(/[\s-]/g, '').trim();
    return this.http.get<any>(`${this.URLSERVICIO}/admin/carnet/persona/${cedulaLimpia}?soloLocal=true`);
  }

  obtenerPersonaCentralizada(cedula: string): Observable<any> {
    const cedulaLimpia = (cedula || '').replace(/[\s-]/g, '').replace(/['"]/g, '').trim();
    return this.http
      .get<any>(`https://centralizada2.espoch.edu.ec/rutadinardap/obtenerpersona/${cedulaLimpia}`)
      .pipe(
        catchError(() => of(null)),
        switchMap((res) => {
          if (res && typeof res === 'object' && ('success' in res || 'listado' in res)) {
            return of(res);
          }
          return this.http.get<any>(`${this.URLSERVICIO}/admin/centralizada/persona/${cedulaLimpia}`);
        })
      );
  }

  crearOActualizarPersona(data: {
    intIdPersona?: number;
    strCedula: string;
    strNombres: string;
    strApellidos: string;
    strCorreo: string;
    strTelefono?: string;
    intEstado: number;
    roles?: number[];
    strDepencia?: string;
    strCargo?: string;
    adminInfo?: any;
  }): Observable<any> {
    return this.http.put<any>(`${this.URLSERVICIO}/admin/persona/rol_dependencia`, {
      intPersona: data.intIdPersona,
      strCedula: data.strCedula,
      strNombres: data.strNombres,
      strApellidos: data.strApellidos,
      strCorreo: data.strCorreo,
      strTelefono: data.strTelefono || '',
      intEstado: data.intEstado,
      roles: data.roles || [],
      intRol: data.roles && data.roles.length > 0 ? data.roles[0] : 1,
      strDepencia: data.strDepencia || 'ESPOCH',
      strCargo: data.strCargo || '',
      adminInfo: data.adminInfo,
    });
  }

  guardarDatosPersona(user: {
    intIdPersona: number;
    strCedula: string;
    strNombres: string;
    strApellidos: string;
    strCorreo: string;
    strTelefono: string;
    intEstado: number;
  }): Observable<any> {
    return this.http.put<any>(`${this.URLSERVICIO}/seguridad/user`, user);
  }

  actualizarRolesPersona(payload: {
    intPersona: number;
    strCedula?: string;
    roles: number[];
    strDepencia: string;
    strCargo?: string;
    adminInfo?: any;
  }): Observable<any> {
    return this.http.put<any>(`${this.URLSERVICIO}/admin/persona/rol_dependencia`, payload);
  }

  // ==========================================
  // GESTIÓN DE ROLES
  // ==========================================

  getTodosRoles(): Observable<{ count: number; message: string; data: IRolAdmin[] }> {
    return this.http.get<{ count: number; message: string; data: IRolAdmin[] }>(
      `${this.URLSERVICIO}/admin/all_roles`
    );
  }

  getRolesActivos(): Observable<{ count: number; message: string; data: IRolAdmin[] }> {
    return this.http.get<{ count: number; message: string; data: IRolAdmin[] }>(
      `${this.URLSERVICIO}/admin/roles`
    );
  }

  crearRol(rol: {
    strNombre: string;
    strDescripcion: string;
    strIcono?: string;
    intEstado: number;
  }): Observable<any> {
    return this.http.post<any>(`${this.URLSERVICIO}/admin/rol`, rol);
  }

  actualizarRol(rol: {
    intIdRol: number;
    strNombre: string;
    strDescripcion: string;
    strIcono?: string;
    intEstado: number;
  }): Observable<any> {
    return this.http.put<any>(`${this.URLSERVICIO}/admin/put_rol`, rol);
  }

  // ==========================================
  // GESTIÓN DE MENÚS Y OPCIONES
  // ==========================================

  getOpcionesPadre(tipo: number = 2): Observable<{ count: number; message: string; data: IPadreOpcion[] }> {
    return this.http.get<{ count: number; message: string; data: IPadreOpcion[] }>(
      `${this.URLSERVICIO}/admin/opciones_padre/${tipo}`
    );
  }

  crearOpcionPadre(body: {
    strNombre: string;
    strIcono?: string;
    intOrden: number;
    intEstado: number;
    strUrl?: string;
  }): Observable<any> {
    return this.http.post<any>(`${this.URLSERVICIO}/admin/opcion_padre`, body);
  }

  actualizarOpcionPadre(body: {
    intPadreOpcion: number;
    strNombre: string;
    strIcono?: string;
    intOrden: number;
    intEstado: number;
    strUrl?: string;
  }): Observable<any> {
    return this.http.put<any>(`${this.URLSERVICIO}/admin/put_opcion_padre`, body);
  }

  eliminarOpcionPadre(id: number): Observable<any> {
    return this.http.delete<any>(`${this.URLSERVICIO}/admin/opcion_padre/${id}`);
  }

  getOpcionesHijas(tipo: number = 2): Observable<{ count: number; message: string; data: IOpcion[] }> {
    return this.http.get<{ count: number; message: string; data: IOpcion[] }>(
      `${this.URLSERVICIO}/admin/opciones/${tipo}`
    );
  }

  crearOpcionHija(body: {
    strNombre: string;
    strDescripcion?: string;
    strUrl: string;
    strMetodo?: string;
    strIcono?: string;
    intOrden: number;
    intEstado: number;
  }): Observable<any> {
    return this.http.post<any>(`${this.URLSERVICIO}/admin/opcion`, body);
  }

  actualizarOpcionHija(body: {
    intIdOpcion: number;
    strNombre: string;
    strDescripcion?: string;
    strUrl: string;
    strMetodo?: string;
    strIcono?: string;
    intOrden: number;
    intEstado: number;
  }): Observable<any> {
    return this.http.put<any>(`${this.URLSERVICIO}/admin/put_opcion`, body);
  }

  eliminarOpcionHija(id: number): Observable<any> {
    return this.http.delete<any>(`${this.URLSERVICIO}/admin/opcion/${id}`);
  }

  // ==========================================
  // PERMISOS Y ASIGNACIÓN DE MENÚ POR ROL
  // ==========================================

  getRolOpciones(tipo: number, rol: number): Observable<{ count: number; message: string; data: IRolOpcion[] }> {
    return this.http.get<{ count: number; message: string; data: IRolOpcion[] }>(
      `${this.URLSERVICIO}/admin/rol_opciones/${tipo}/${rol}`
    );
  }

  sincronizarRolOpciones(intRol: number, opciones: any[]): Observable<any> {
    return this.http.post<any>(`${this.URLSERVICIO}/admin/rol_opciones_sync`, {
      intRol,
      opciones,
    });
  }

  getMenuPreview(rol: number): Observable<{ count: number; message: string; data: any[] }> {
    return this.http.get<{ count: number; message: string; data: any[] }>(
      `${this.URLSERVICIO}/admin/menu/${rol}`
    );
  }
}
