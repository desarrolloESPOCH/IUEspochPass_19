
export interface TalentoHumano {
    success?: boolean;
    data?:    Data;
	msg?: string
}

export interface Data {
    perCedula?:      string;
    perApellidos?:   string;
    perNombres?:     string;
    accionPersonal?: AccionPersonal;
    contrato?:       Contrato;
}

export interface AccionPersonal {
    apeEstado?:               boolean;
    apeRegimen?:              string;
    apeTipoDocumento?:        string;
    apeTipo?:                 string;
    apeFechaInicio?:          Date;
    apeFechaFin?:             null;
    apeCargo?:                string;
    apeTiempoDedicacion?:     string;
    apeDepedenciaGeneral?:    string;
    apeDepedenciaEspecifica?: string;
}

export interface Contrato {
    conEstado?:                boolean;
    conRegimen?:               string;
    conTipoDocumento?:         string;
    conModalidad?:             string;
    conFechaInicio?:           Date;
    conFechaFin?:              Date;
    conCargo?:                 string;
    conTiempoDedicacion?:      string;
    conDependenciaGeneral?:    string;
    conDependenciaEspecifica?: string;
}
