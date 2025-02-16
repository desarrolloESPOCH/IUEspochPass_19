// cspell:disable
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { IResponse } from '../usuarios/interfaces/IResponse.interface';
import { IQr, IQrValidarParams } from './interfaces/IQr.interface';

@Injectable({
  providedIn: 'root',
})
export class QrService {
  private _http = inject(HttpClient);

  buscarCarnet = (per_id: string) => {
    console.log(`${environment.SERVICIO_WEB}/carnet/get_carnet/${per_id}`);
    return this._http.get<IResponse<IQr>>(
      `${environment.SERVICIO_WEB}/carnet/get_carnet/${per_id}`
    );
  };
  generarQr = (body: Object) => {
    return this._http.post<IResponse<IQr>>(
      `${environment.SERVICIO_WEB}/carnet/qr`,
      body
    );
  };

  validarQr = (body: IQrValidarParams) => {
    return this._http.post<IResponse<any>>(
      `${environment.SERVICIO_WEB}/carnet/validar_qr`,
      body
    );
  };
}
