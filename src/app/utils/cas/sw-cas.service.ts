import { environment } from './../../../environments/environment';
import { inject, Injectable, signal } from '@angular/core';
import { BehaviorSubject, firstValueFrom, map, Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Base64 } from 'js-base64';
import { Router } from '@angular/router';
import { swUsuariosService } from '../../services/usuarios/Usuarios.service';
// import { EventosService } from '../../services/otros/EventosService';

@Injectable({
  providedIn: 'root',
})
export class SwCasService {
  private http = inject(HttpClient);
  private router = inject(Router);
  // private swEventService = inject(EventosService);
  swUser = inject(swUsuariosService);
  user = signal({});
  nombres = signal('');
  apellidos = signal('');
  idProceso = signal(0);

  private datosDeSesionSubject = new BehaviorSubject<any>(null);
  datosDeSesion$ = this.datosDeSesionSubject.asObservable();

  constructor() {}

  loginLocal() {
    window.location.href = `https://seguridad.espoch.edu.ec/cas/login?service=${environment.REDIRECT_URI}/cas`;
  }

  validateTicketLocal(ticket: string): Observable<any> {
    // Valida el ticket del servicio en el servidor CAS a través del servidor intermedio
    const validationUrl = `${environment.VALIDATE}?service=${environment.REDIRECT_URI}/cas&ticket=${ticket}`;
    return this.http.get(validationUrl, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json; charset=utf-8',
      }),
    });
  }

  logoutLocal(): void {
    this.removeSession();
  }

  getUserInfo = (): IJsonUser => {
    let userSession = sessionStorage.getItem('user');
    if (!userSession) return {} as IJsonUser;
    this.user.set(userSession);
    const decryptedUserString = Base64.decode(userSession);
    let infoUser = JSON.parse(decryptedUserString);
    return infoUser;
  };

  async saveInfo(user: any) {
    // let user = await this.transformXmltoJson(res);
    sessionStorage.setItem('user', Base64.encode(JSON.stringify(user)));
    this.datosDeSesionSubject.next(this.getUserInfo());
    this.user.set(this.getUserInfo());
  }

  async transformXmltoJson(xmlString: string) {
    let parser = xmlString.split('<cas:authenticationFailure')[1];
    if (parser) {
      //if esta undefinied no permite ingresar y necesita generar un nuevo ticket
      console.log('no esta logueado');
      // this.loginLocal();
      return {
        per_email: '',
        per_id: '',
        newLogin: '',
        cedula: '',
        nombres: '',
        apellidos: '',
        periodoAcademico: '',
        procesoEvaluacion: '',
      };
    }

    let atributos = xmlString
      .split('<cas:attributes>')[1]
      .split('</cas:attributes')[0];
    let perId = atributos.split('<cas:perid>')[1].split('</cas:perid>')[0];
    // await this.getUserRoles(Number(perId));
    return {
      per_email: this.validarAtributo(atributos, '<cas:upn>', '</cas:upn>'),
      per_id: this.validarAtributo(atributos, '<cas:perid>', '</cas:perid>'),
      newLogin: this.validarAtributo(
        atributos,
        '<cas:isFromNewLogin>',
        '</cas:isFromNewLogin>'
      ),
      cedula: this.validarAtributo(atributos, '<cas:cedula>', '</cas:cedula>'),
      // nombres: this.nombres(),
      nombres: this.validarAtributo(
        atributos,
        '<cas:given_name>',
        '</cas:given_name>'
      ),
      // apellidos: this.apellidos(),
      apellidos: this.validarAtributo(
        atributos,
        '<cas:family_name>',
        '</cas:family_name>'
      ),
      periodoAcademico: '',
      procesoEvaluacion: '',
    };
  }

  validarAtributo = (atributo: string, inicio: string, fin: string) => {
    const inicioPos = atributo.indexOf(inicio);
    const finPos = atributo.indexOf(fin, inicioPos + inicio.length);
    return inicioPos !== -1 && finPos !== -1
      ? atributo.substring(inicioPos + inicio.length, finPos)
      : '';
  };

  private removeSession = () => {
    sessionStorage.clear();
  };

  getUserRoles = async (perId: number) => {
    try {
      const response = await firstValueFrom(this.swUser.getRolesByUser(perId));
      // this.idProceso.set(response.data[0].roles[0].intIdProcesoEva);
      // this.nombres.set(response.data[0].strNombres);
      // this.apellidos.set(response.data[0].strApellidos);
    } catch (error) {
      console.error(error);
    }
  };

  ActualizarInvitados = (user: IJsonUser) => {
    sessionStorage.setItem('user', Base64.encode(JSON.stringify(user)));
    this.datosDeSesionSubject.next(this.getUserInfo());
    this.user.set(this.getUserInfo());
  };
  ActualizarProceso = (id: string, periodo: string) => {
    const user: IJsonUser = this.getUserInfo();
    user.procesoEvaluacion = id;
    user.periodoAcademico = periodo;
    sessionStorage.setItem('user', Base64.encode(JSON.stringify(user)));
    this.datosDeSesionSubject.next(this.getUserInfo());
    this.user.set(this.getUserInfo());
  };
}

export interface IJsonUser {
  per_email: string;
  per_id: string;
  newLogin: string;
  cedula: string;
  nombres: string;
  apellidos: string;
  procesoEvaluacion?: string;
  periodoAcademico?: string;
}
