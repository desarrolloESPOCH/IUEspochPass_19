// cspell: disable;
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class swCentralService {
  // private URLCORREO = 'http://localhost:3000/';
  private __http = inject(HttpClient);
  private URLSERVICIO = environment.URL_CENTRAL;
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
}
