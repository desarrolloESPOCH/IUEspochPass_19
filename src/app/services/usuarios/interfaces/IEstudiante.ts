export interface IEstudiante {
  carreraSelecionadaCodigo: string;
  carreraSeleccionada: string;
  carreraSelecionadaBase: string;
  carreraSelecionadaCodigoUnica: string;
  carreraSelecionadaFacultadCodigo: string;
  carreraSelecionadaFacultad: string;
  strnombre: string;
  strfoto: string;
}

export interface IEstudianteConfirma {
  success: boolean;
  listado: IEstudiante[];
}
