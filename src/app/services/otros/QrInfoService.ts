import { EventEmitter, Injectable, signal } from '@angular/core';
import { IQr } from './interfaces/IQr.interface';

@Injectable({
  providedIn: 'root',
})
export class QrInfo {
  datos: IQr = {} as IQr;
  constructor() {}
}
