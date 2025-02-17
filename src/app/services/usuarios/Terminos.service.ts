// cspell: disable;
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { IResponse } from './interfaces/IResponse.interface';
import { Itermino } from './interfaces/Itermino';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class swTerminosService {
  // private URLCORREO = 'http://localhost:3000/';
  private __http = inject(HttpClient);
  private URLSERVICIO = environment.SERVICIO_WEB;
  constructor() {}

  getTerminos = () => {
    return this.__http.get<IResponse<Itermino>>(
      `${this.URLSERVICIO}/admin/terminos`
    );
  };

  NuevoTermimo = (body: Itermino) => {
    return this.__http.post<IResponse<Itermino>>(
      `${this.URLSERVICIO}/admin/termino`,
      body
    );
  };

  ModificarTermino = (body: Itermino) => {
    return this.__http.put<IResponse<Itermino>>(
      `${this.URLSERVICIO}/admin/put_termino`,
      body
    );
  };

  getTerminosByIdRol = (id_rol: number) => {
    return this.__http.get<IResponse<Itermino>>(
      `${this.URLSERVICIO}/carnet/get_terminos/${id_rol}`
    );
  };
}
