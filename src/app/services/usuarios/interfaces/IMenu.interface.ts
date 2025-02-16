export interface SubOpcione {
  opc_id: number;
  opc_nombre: string;
  opc_descripcion: string;
  opc_url: string;
  opc_metodo?: any;
  opc_estado: number;
  opc_icono: string;
  opc_orden: number;
}

export interface Data {
  pado_id: number;
  pado_nombre: string;
  pado_estado: number;
  pado_icono: string;
  pado_orden: number;
  subOpciones: SubOpcione[];
}

export interface IMenu {
  count: number;
  message: string;
  data: Data[];
}
