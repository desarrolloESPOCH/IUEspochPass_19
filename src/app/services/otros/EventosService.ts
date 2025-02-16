import { EventEmitter, Injectable, inject } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class EventosService {
  rolCambiado = new EventEmitter<number>();
  permisos = new EventEmitter<Permitions>();
  ShowTimeLine = new EventEmitter<boolean>();
  ToastService = new EventEmitter<any>();
  CaminoMijasService = new EventEmitter<any>();
  LoadingService = new EventEmitter<boolean>();
  obProceso = new EventEmitter<any>();

  constructor() {}

  cambiarRol(rol: number) {
    this.rolCambiado.emit(rol);
  }

  getRol() {
    return this.rolCambiado;
  }

  toggleTimeLine(show: boolean) {
    this.ShowTimeLine.emit(show);
  }

  getTimeLine() {
    return this.ShowTimeLine;
  }

  updatePermisos(permition: Permitions) {
    sessionStorage.setItem('permisos', JSON.stringify(permition));
    this.permisos.emit(permition);
  }

  getPermiso() {
    let permisos = sessionStorage.getItem('permisos');
    if (permisos) {
      this.permisos.emit(JSON.parse(permisos));
    }
    return this.permisos;
  }

  setToast(objToast: any) {
    this.ToastService.emit(objToast);
  }

  getToast() {
    return this.ToastService;
  }

  setCaminoMijas(camino: any) {
    sessionStorage.setItem('camino', JSON.stringify(camino));
    this.CaminoMijasService.emit(camino);
  }

  getCaminoMijas() {
    let camino = sessionStorage.getItem('camino');
    if (camino) {
      this.CaminoMijasService.emit(JSON.parse(camino));
    }
    return this.CaminoMijasService;
  }
  setLoading(objLoad: boolean) {
    this.LoadingService.emit(objLoad);
  }

  getLoading() {
    return this.LoadingService;
  }
  setIdProceso(obj: any) {
    this.obProceso.emit(obj);
  }

  getIdProceso() {
    return this.obProceso;
  }
}

export interface Permitions {
  bitInsertar: boolean;
  bitMmodificar: boolean;
  bitEliminar: boolean;
}
