import { IRol } from './IRol.interface';

export interface IUser {
  intIdPersona: number;
  strCedula: string;
  strNombres: string;
  strApellidos: string;
  strCorreo: string;
  strTelefono: string;
  intEstado: number;
  roles?: IRol[];
}
