// cspell: disable;
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';

import { Observable, catchError, of, switchMap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class swCentralService {
  // private URLCORREO = 'http://localhost:3000/';
  private __http = inject(HttpClient);
  private URLSERVICIO = environment.URL_CENTRAL;
  private URLWS = environment.SERVICIO_WEB;
  constructor() {}

  getObjPersona = (cedula: string) => {
    return this.__http.get(`${this.URLSERVICIO}/objpersonalizado/${cedula}`, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json; charset=utf-8',
      }),
    });
  };

  getPersonaPerId = (per_id: number) => {
    return this.__http.get(
      `https://centralizada2.espoch.edu.ec/rutaCentral/objetopersonalizadodadoid/${per_id}`,
      {
        headers: new HttpHeaders({
          'Content-Type': 'application/json; charset=utf-8',
        }),
      }
    );
  };

  obtenerPersonaCentralizada = (cedula: string): Observable<any> => {
    const cedulaLimpia = (cedula || '').replace(/[\s-]/g, '').replace(/['"]/g, '').trim();
    return this.__http.get<any>(
      `https://centralizada2.espoch.edu.ec/rutadinardap/obtenerpersona/${cedulaLimpia}`
    ).pipe(
      catchError(() => of(null)),
      switchMap((res) => {
        if (res && typeof res === 'object' && ('success' in res || 'listado' in res)) {
          return of(res);
        }
        return this.__http.get<any>(
          `${this.URLWS}/admin/centralizada/persona/${cedulaLimpia}`
        );
      })
    );
  };
}
