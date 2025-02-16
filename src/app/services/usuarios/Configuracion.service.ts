// cspell: disable;
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { IResponse } from './interfaces/IResponse.interface';
import { IMenu } from './interfaces/IMenu.interface';

@Injectable({
  providedIn: 'root',
})
export class swConfiguracionService {
  private serviceUser = inject(HttpClient);
  private __http = inject(HttpClient);
  private URLSERVICIO = environment.SERVICIO_WEB;
  constructor() {}

  getConfiguracionById = (idEstado: number, idRol: number) => {
    return this.serviceUser.get<IResponse<IMenu>>(
      `${this.URLSERVICIO}/admin/rol_configuraciones/${idEstado}/${idRol}`
    );
  };

  putConfiguracion = (json: Object) => {
    return this.serviceUser.put<IResponse<IMenu>>(
      `${this.URLSERVICIO}/admin/put_configuracion`,
      json
    );
  };

  postConfiguracion = (json: Object) => {
    return this.serviceUser.post<IResponse<IMenu>>(
      `${this.URLSERVICIO}/admin/configuracion`,
      json
    );
  };
}
