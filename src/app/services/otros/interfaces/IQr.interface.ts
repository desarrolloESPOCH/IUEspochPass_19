export interface IQr {
  intIdCarnet: string;
  dtFecha_Inicio: string;
  dtFecha_Fin: string;
  intUsuario: number;
  intEstado: number;
}

export interface IQrValidarParams {
  strHash: string;
  intIdQr: string;
  strUsuarioRegitro: number;
  intTipoRegistro: number;
  intEstado: number;
}
