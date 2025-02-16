import { inject, Injectable } from '@angular/core';
import { persistenciaServices } from '../persistencia/persistencia.service';
import { swMasterService } from '../master/masterServices.service';
import { swCentralizada } from '../seguridad/Central.service';
import { EventosService } from './EventosService';

@Injectable({
    providedIn: 'root',
})
export class recursosCompartido {
    private srvPersistencia = inject(persistenciaServices); private srvEventServices = inject(EventosService);
    private srvMaster = inject(swMasterService); private srvCentral = inject(swCentralizada);

    //=============================OBTENER ESTUDIANTES
    async gestionMigracionEstudiantes(codCarrera: any, datoEstudiante: any, vecPersona: any, procesoEva: any) {
        let vecEstudiante = []; let vecAuxEstudiante = []; let cont = 0; let ban = 0; let banPersona;
        for (let objEst of datoEstudiante.data) {
            let objPersona = vecPersona.data.filter((objPer: any) => objPer.strCedula == objEst.strCedula);
            if (objPersona.length > 0)//VERIFICAMOS SI EL ESTUDIANTE YA ESTÁ EN LA TABLA PERSONA
                banPersona = {
                    intIdPersona: objPersona[0].intIdPersona, strApellidos: objPersona[0].strApellidos, strCargo: objPersona[0].strCargo,
                    strCedula: objPersona[0].strCedula, correo: objPersona[0].strCorreo, strDependencia: objPersona[0].strDependencia,
                    strNombres: objPersona[0].strNombres, telefono: objPersona[0].strTelefono, fechaNacimiento: objPersona[0].dtFechaNacimiento.split('T')[0],
                    pais: objPersona[0].strNacionalidad, sexo: objPersona[0].intSexo, tipo: 8, proceso: procesoEva, existe: 1
                };
            else {
                const resCentral = await new Promise<any>(resolve => this.srvCentral.getPersonaCedula(objEst.strCedula).subscribe(translated => { resolve(translated) }));
                if (resCentral.success) {
                    banPersona = {
                        intIdPersona: resCentral.listado[0].per_id, strApellidos: resCentral.listado[0].per_primerApellido + ' ' + resCentral.listado[0].per_segundoApellido,
                        strCargo: 'ESTUDIANTE', strCedula: objEst.strCedula, correo: resCentral.listado[0].per_email, strDependencia: codCarrera,
                        strNombres: resCentral.listado[0].per_nombres, telefono: resCentral.listado[0].per_telefonoCelular,
                        fechaNacimiento: resCentral.listado[0].per_fechaNacimiento.split('T')[0],
                        pais: 'na', sexo: resCentral.listado[0].sex_id, tipo: 8, proceso: procesoEva, existe: 0
                    };
                }
                else {
                    console.log('NO ENCONTRADO EN LA CENTRAL (E) ====================  ', objEst.strCedula)
                }
            }

            cont++; ban++;
            vecAuxEstudiante.push({
                "telefono": objEst.strTelefono, "nacionalidad": objEst.strNacionalidad, "sexo": objEst.intSexo, "estado": "1", "creado": "SYSTEM",
                persona: banPersona
            });
            if ((ban == 175) || (cont == datoEstudiante.count)) {
                vecEstudiante.push({ datoRegistro: vecAuxEstudiante });
                ban = 0; vecAuxEstudiante = [];
            }
            if (cont == datoEstudiante.count)
                this.recorridoRegistroMigracion(vecEstudiante, 1);
        }
    }
    //=============================OBTENER DOCENTES
    async gestionMigracionDocentes(codCarrera: any, datoDocente: any, vecPersona: any, procesoEva: any) {
        let vecDocente = []; let vecAuxDocente = []; let cont = 0; let ban = 0; let banPersona;
        for (let objDoc of datoDocente.data) {
            let objPersona = vecPersona.data.filter((objPer: any) => objPer.strCedula == objDoc.strCedula);
            if (objPersona.length > 0)//VERIFICAMOS SI EL DOCENTE YA ESTÁ EN LA TABLA PERSONA
                banPersona = {
                    intIdPersona: objPersona[0].intIdPersona, strApellidos: objPersona[0].strApellidos, strCargo: objPersona[0].strCargo,
                    strCedula: objPersona[0].strCedula, correo: objPersona[0].strCorreo, strDependencia: objPersona[0].strDependencia,
                    strNombres: objPersona[0].strNombres, telefono: objPersona[0].strTelefono, fechaNacimiento: objPersona[0].dtFechaNacimiento.split('T')[0],
                    pais: objPersona[0].strNacionalidad, sexo: objPersona[0].intSexo, tipo: 8, proceso: procesoEva, existe: 1
                };
            else {
                const resCentral = await new Promise<any>(resolve => this.srvCentral.getPersonaCedula(objDoc.strCedula).subscribe(translated => { resolve(translated) }));
                if (resCentral.success) {
                    banPersona = {
                        intIdPersona: resCentral.listado[0].per_id, strApellidos: resCentral.listado[0].per_primerApellido + ' ' + resCentral.listado[0].per_segundoApellido,
                        strCargo: 'DOCENTE', strCedula: objDoc.strCedula, correo: resCentral.listado[0].per_email, strDependencia: codCarrera,
                        strNombres: resCentral.listado[0].per_nombres, telefono: resCentral.listado[0].per_telefonoCelular,
                        fechaNacimiento: resCentral.listado[0].per_fechaNacimiento.split('T')[0],
                        pais: 'na', sexo: resCentral.listado[0].sex_id, tipo: 8, proceso: procesoEva, existe: 0
                    };
                }
                else
                    console.log('NO ENCONTRADO EN LA CENTRAL (D) ====================  ', objDoc.strCedula)
            }
            cont++; ban++;
            vecAuxDocente.push({
                "telefono": objDoc.fono, "nacionalidad": objDoc.strNacionalidad, "sexo": objDoc.codSexo, "estado": "1", "creado": "SYSTEM",
                persona: banPersona
            });
            if ((ban == 175) || (cont == datoDocente.count)) {
                vecDocente.push({ datoRegistro: vecAuxDocente });
                ban = 0; vecAuxDocente = [];
            }
            if (cont == datoDocente.count)
                this.recorridoRegistroMigracion(vecDocente, 2);
        }
    }
    //=============================OBTENER MATERIAS
    async gestionMigracionMaterias(codFacultad: any, codUnico: any, codCarrera: any, datoMateria: any) {
        let vecMateria = []; let vecAuxMateria = []; let cont = 0; let ban = 0;
        for (let objMat of datoMateria.data) {
            cont++; ban++;
            vecAuxMateria.push({
                "facultad": codFacultad, "carrera": codCarrera, "codUnico": codUnico, "codPensum": objMat.strCodPensum, "codGrado": 1,
                "codMateria": objMat.strCodigo, "nombMateria": objMat.strNombre, "codArea": objMat.areaCodigo, "nombArea": objMat.areaNombre, "codTipoMateria": objMat.tipoCodigo,
                "nombTipoMateria": objMat.tipoNombre, "codDictado": objMat.dictaCodigo, "nombDictado": objMat.dictaNombre, "creditos": objMat.fltCreditos,
                "horasTeoricas": objMat.bytHorasTeo, "horasPracticas": objMat.bytHorasPrac, "horasAutonomas": objMat.bytHorasAut, "estado": 1, "creado": "SYSTEM"
            });
            if ((ban == 175) || (cont == datoMateria.count)) {
                vecMateria.push({ datoRegistro: vecAuxMateria });
                ban = 0; vecAuxMateria = [];
            }
            if (cont == datoMateria.count)
                this.recorridoRegistroMigracion(vecMateria, 3);
        }
    }
    //=============================OBTENER MATERIAS
    async gestionMigracionDictado(codCarrera: any, dataDicta: any) {
        let vecDictado = []; let vecAuxDictado = []; let cont = 0; let ban = 0;
        for (let objDic of dataDicta.data) {
            cont++; ban++;
            vecAuxDictado.push({
                'carrera': codCarrera, 'pensum': objDic.strCodPensum, 'materia': objDic.strCodigo, 'periodo': objDic.strCodPeriodo,
                'docente': objDic.strCedula, 'nivel': objDic.strCodNivel, 'paralelo': objDic.strCodParalelo, 'estado': '1', 'codGrado': 1, 'creado': 'SYSTEM'
            })
            if ((ban == 175) || (cont == dataDicta.count)) {
                vecDictado.push({ datoRegistro: vecAuxDictado });
                ban = 0; vecAuxDictado = [];
            }
            if (cont == dataDicta.count)
                this.recorridoRegistroMigracion(vecDictado, 4);
        }
    }
    //=============================OBTENER MATRICULAS
    async gestionMigracionMatriculas(codCarrera: any, dataMatr: any, dataEstMatr: any, procesoEva: any) {
        let vecEstadoMatriculas: Array<any> = []; let vecMatriculas = []; let vecAuxMatricula = []; let cont = 0; let ban = 0;
        vecEstadoMatriculas = dataEstMatr.data;
        //=============================OBTENER MATRICULAS
        for (let objMatr of dataMatr.data) {
            cont++; ban++;
            let vecAuxEstado = vecEstadoMatriculas.filter(item => item.strCodMateria == objMatr.strCodigo && item.sintCodMatricula == objMatr.sintCodigo);
            vecAuxMatricula.push({
                'carrera': codCarrera, 'materia': objMatr.strCodigo, 'docente': objMatr.cedDocente, 'periodo': objMatr.strCodPeriodo, 'nivel': objMatr.strCodNivel,
                'paralelo': objMatr.strCodParalelo, 'cedEstudiante': objMatr.cedEstudiante, 'codEstudiante': objMatr.codEstudiante, 'codMatricula': objMatr.sintCodigo,
                'numMatricula': objMatr.bytNumMat, 'asistencia': objMatr.bytAsistencia, 'estadoMatricula': objMatr.strCodEstado, 'codGrado': 1,
                'acumulado': vecAuxEstado.length > 0 ? vecAuxEstado[0]['bytAcumulado'] : '0', 'nota': vecAuxEstado.length > 0 ? vecAuxEstado[0]['bytNota'] : '0',
                'aprueba': vecAuxEstado.length > 0 ? vecAuxEstado[0]['strCodEquiv'] : '0', codProceso: procesoEva, 'estado': '1', 'creado': 'SYSTEM'
            });
            if ((ban == 175) || (cont == dataMatr.count)) {
                vecMatriculas.push({ datoRegistro: vecAuxMatricula });
                ban = 0; vecAuxMatricula = [];
            }
            if (cont == dataMatr.count)
                this.recorridoRegistroMigracion(vecMatriculas, 5);
        }
    }

    //RECCORE EL VECTOR CON LA INFORMACION A SER MIGRADA
    recorridoRegistroMigracion(datoMigrar: any, op: number) {
        console.log('=========================   ENTRA CONSUMO GENERAL   =========================  ', op)
        let contReg = 0;
        while (contReg < datoMigrar.length) {
            this.opcionesRegistro(datoMigrar[contReg].datoRegistro, op);
            contReg++;
        }
    }
    //FUNCIÓN QUE REGISTRA LA INFORMACION ENVIADA
    opcionesRegistro(vectorMigar: any, op: number) {
        this.srvPersistencia.registroEstudiantePersistencia(vectorMigar, op).subscribe({
            next: (res: any) => {
                if (res.count == 1)
                    this.srvEventServices.setToast({ severity: 'success', summary: 'Proceso Evaluación', detail: 'Registro exitoso' + op });
                else
                    this.srvEventServices.setToast({ severity: 'error', summary: 'Proceso de Evaluación', detail: 'No se pudo realizar el registro' + op });
            },
            error: (e: any) => {
                this.srvEventServices.setToast({ severity: 'error', summary: 'Proceso Evaluación', detail: 'Error al actulizar el prceso de Evaluación' + op });
            },
        });
    }

}