import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class FotoService {
  private _http = inject(HttpClient);

  consultarEstudiante = (cedula: string) => {
    return this._http.get(`${environment.FOTO_ACADEMICO}/${cedula}`);
  };
  consultarAdministrativo = (per_id: number) => {
    return this._http.get(`${environment.FOTO_TTHH}/${per_id}`);
  };
}
