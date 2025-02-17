import { EventEmitter, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class RolService {
  rolCambiado = new EventEmitter<number>();
  constructor() {}

  cambiarRol(rol: number) {
    this.rolCambiado.emit(rol);
  }

  getRol() {
    return this.rolCambiado;
  }
}
