// cspell:disable
import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ProgressBarModule } from 'primeng/progressbar';
import * as XLSX from 'xlsx';

import {
  AdminCarnetsService,
  IInvitadoAdmin,
} from '../../../../services/admin/AdminCarnets.service';
import { SwCasService } from '../../../../utils/cas/sw-cas.service';

export interface IFilaPreviaExcel {
  fila: number;
  cedula: string;
  dependencia: string;
  cargo: string;
  telefono: string;
  correo: string;
  valido: boolean;
  motivo: string;
}

@Component({
  selector: 'app-pg-admin-invitados',
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    Select,
    DialogModule,
    ToastModule,
    TagModule,
    TooltipModule,
    IconFieldModule,
    InputIconModule,
    ProgressBarModule,
    DatePipe,
  ],
  providers: [MessageService],
  templateUrl: './pg-admin-invitados.component.html',
  styleUrl: './pg-admin-invitados.component.css',
})
export default class PgAdminInvitadosComponent implements OnInit {
  private adminService = inject(AdminCarnetsService);
  private messageService = inject(MessageService);
  private swCas = inject(SwCasService);

  // Estados de carga
  loading = signal<boolean>(false);
  savingIndividual = signal<boolean>(false);
  processingMasivo = signal<boolean>(false);
  searchingPersona = signal<boolean>(false);

  // Listado y métricas
  invitados = signal<IInvitadoAdmin[]>([]);
  totalInvitados = signal<number>(0);
  activosCount = signal<number>(0);
  desactivadosCount = signal<number>(0);

  // Filtros
  filtroBusqueda: string = '';
  filtroEstado: string = 'TODOS';

  estadosList = [
    { label: 'Todos los estados', value: 'TODOS' },
    { label: 'Activos / Habilitados', value: '1' },
    { label: 'Desactivados / Inactivos', value: '0' },
  ];

  // ==============================
  // MODAL ALTA INDIVIDUAL
  // ==============================
  dialogAgregar = signal<boolean>(false);
  cedulaNuevo: string = '';
  personaPreview: any = null;
  nuevoNombres: string = '';
  nuevoApellidos: string = '';
  nuevoCorreo: string = '';
  nuevoTelefono: string = '';
  nuevoDependencia: string = '';
  nuevoCargo: string = '';
  mesesVigenciaIndividual: number = 6; // Por defecto 6 meses
  mostrarCamposManuales = signal<boolean>(false);

  // ==============================
  // MODAL CARGA MASIVA EXCEL
  // ==============================
  dialogMasivo = signal<boolean>(false);
  archivoSeleccionado: File | null = null;
  nombreArchivo: string = '';
  filasPrevia = signal<IFilaPreviaExcel[]>([]);
  totalValidos = signal<number>(0);
  totalInvalidos = signal<number>(0);
  mesesVigenciaMasivo: number = 6; // Por defecto 6 meses
  progresoMasivo = signal<number>(0);
  resultadoLote = signal<any | null>(null);

  ngOnInit() {
    this.cargarInvitados();
  }

  cargarInvitados() {
    this.loading.set(true);
    const params: any = {
      busqueda: this.filtroBusqueda,
    };
    if (this.filtroEstado !== 'TODOS') {
      params.estado = this.filtroEstado;
    }

    this.adminService.getInvitados(params).subscribe({
      next: (res) => {
        const list = res.data || [];
        this.invitados.set(list);
        this.totalInvitados.set(list.length);
        this.activosCount.set(list.filter((inv) => inv.estadoInvitado === 1).length);
        this.desactivadosCount.set(list.filter((inv) => inv.estadoInvitado === 0).length);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cargar el listado de invitados.',
        });
      },
    });
  }

  limpiarFiltros() {
    this.filtroBusqueda = '';
    this.filtroEstado = 'TODOS';
    this.cargarInvitados();
  }

  // Cambiar Estado con Auditoría
  cambiarEstado(invitado: IInvitadoAdmin) {
    const nuevoEstado = invitado.estadoInvitado === 1 ? 0 : 1;
    const accion = nuevoEstado === 1 ? 'habilitar' : 'deshabilitar';
    const adminInfo = this.swCas.getUserInfo();

    this.adminService.cambiarEstadoInvitado(invitado.intPersona, nuevoEstado, adminInfo).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Estado Actualizado',
          detail: `Invitado ${accion === 'habilitar' ? 'habilitado' : 'deshabilitado'} exitosamente.`,
        });
        this.cargarInvitados();
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `No se pudo ${accion} al invitado.`,
        });
      },
    });
  }

  // ==============================
  // FLUJO INDIVIDUAL
  // ==============================
  abrirModalAgregar() {
    this.cedulaNuevo = '';
    this.personaPreview = null;
    this.nuevoNombres = '';
    this.nuevoApellidos = '';
    this.nuevoCorreo = '';
    this.nuevoTelefono = '';
    this.nuevoDependencia = '';
    this.nuevoCargo = 'ATENCIÓN / PERSONAL';
    this.mesesVigenciaIndividual = 6;
    this.mostrarCamposManuales.set(false);
    this.dialogAgregar.set(true);
  }

  buscarPersonaPorCedula() {
    const cedula = this.cedulaNuevo.trim();
    if (!cedula) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atención',
        detail: 'Ingrese un número de cédula válido.',
      });
      return;
    }

    this.searchingPersona.set(true);
    this.personaPreview = null;
    this.mostrarCamposManuales.set(false);

    this.adminService.getPersonaCarnet(cedula).subscribe({
      next: (res) => {
        this.searchingPersona.set(false);
        if (res && res.data && res.data.length > 0) {
          this.personaPreview = res.data[0];
          if (this.personaPreview.strDepencia) {
            this.nuevoDependencia = this.personaPreview.strDepencia;
          }
        } else {
          this.mostrarCamposManuales.set(true);
          this.messageService.add({
            severity: 'info',
            summary: 'Persona no registrada',
            detail: 'Complete los nombres y apellidos manualmente para el registro.',
          });
        }
      },
      error: () => {
        this.searchingPersona.set(false);
        this.mostrarCamposManuales.set(true);
      },
    });
  }

  guardarNuevoInvitado() {
    if (!this.cedulaNuevo || this.cedulaNuevo.trim() === '') {
      this.messageService.add({
        severity: 'warn',
        summary: 'Cédula requerida',
        detail: 'Ingrese el número de cédula del invitado.',
      });
      return;
    }

    if (!this.nuevoDependencia || this.nuevoDependencia.trim() === '') {
      this.messageService.add({
        severity: 'warn',
        summary: 'Dependencia / Bar requerida',
        detail: 'Indique el bar, local o empresa proveedora a la que pertenece.',
      });
      return;
    }

    this.savingIndividual.set(true);
    const adminInfo = this.swCas.getUserInfo();

    const body: any = {
      strCedula: this.cedulaNuevo.trim(),
      strDepencia: this.nuevoDependencia.trim(),
      strCargo: this.nuevoCargo.trim() || 'INVITADO',
      mesesVigencia: this.mesesVigenciaIndividual || 6,
      adminInfo: adminInfo,
    };

    if (this.mostrarCamposManuales()) {
      body.strNombres = this.nuevoNombres.trim();
      body.strApellidos = this.nuevoApellidos.trim();
      body.strCorreo = this.nuevoCorreo.trim();
      body.strTelefono = this.nuevoTelefono.trim();
    }

    this.adminService.agregarInvitado(body).subscribe({
      next: (res) => {
        this.savingIndividual.set(false);
        this.dialogAgregar.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Invitado Registrado',
          detail: 'El usuario fue registrado con rol INVITADO y su carnet activado por 6 meses.',
        });
        this.cargarInvitados();
      },
      error: (err) => {
        this.savingIndividual.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.message || 'No se pudo registrar al invitado.',
        });
      },
    });
  }

  // ==============================
  // FLUJO CARGA MASIVA EXCEL
  // ==============================
  abrirModalMasivo() {
    this.archivoSeleccionado = null;
    this.nombreArchivo = '';
    this.filasPrevia.set([]);
    this.totalValidos.set(0);
    this.totalInvalidos.set(0);
    this.mesesVigenciaMasivo = 6;
    this.progresoMasivo.set(0);
    this.resultadoLote.set(null);
    this.dialogMasivo.set(true);
  }

  descargarPlantilla() {
    const encabezados = [
      ['CEDULA', 'LOCAL_O_EMPRESA', 'CARGO', 'TELEFONO', 'CORREO'],
      ['1850575133', 'Bar Facultad de Mecánica', 'Atención al Cliente', '0991234567', 'personal_bar@gmail.com'],
      ['0604123456', 'Distribuidora Lácteos San Pedro', 'Repartidor / Proveedor', '0987654321', 'proveedor@lacteos.com'],
    ];

    const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(encabezados);
    ws['!cols'] = [
      { wch: 15 },
      { wch: 35 },
      { wch: 25 },
      { wch: 15 },
      { wch: 30 },
    ];

    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Invitados_Proveedores');
    XLSX.writeFile(wb, 'Plantilla_Invitados_ESPOCH.xlsx');
  }

  onArchivoSeleccionado(event: any) {
    const file = event.target.files?.[0];
    if (!file) return;
    this.procesarArchivoExcel(file);
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    if (file) {
      this.procesarArchivoExcel(file);
    }
  }

  procesarArchivoExcel(file: File) {
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Formato no compatible',
        detail: 'Por favor seleccione un archivo Excel válido (.xlsx o .xls).',
      });
      return;
    }

    this.archivoSeleccionado = file;
    this.nombreArchivo = file.name;
    this.resultadoLote.set(null);

    const reader = new FileReader();
    reader.onload = (e: any) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        if (!json || json.length === 0) {
          this.messageService.add({
            severity: 'warn',
            summary: 'Archivo vacío',
            detail: 'La hoja de cálculo no contiene filas de datos.',
          });
          return;
        }

        const previsualizacion: IFilaPreviaExcel[] = [];
        let validos = 0;
        let invalidos = 0;

        json.forEach((row: any, index: number) => {
          const rawCedula = String(row['CEDULA'] || row['cedula'] || row['Cedula'] || row['Cédula'] || '').trim();
          const dependencia = String(row['LOCAL_O_EMPRESA'] || row['EMPRESA'] || row['DEPENDENCIA'] || row['dependencia'] || row['Bar'] || 'BAR / PROVEEDOR').trim();
          const cargo = String(row['CARGO'] || row['cargo'] || 'INVITADO').trim();
          const telefono = String(row['TELEFONO'] || row['telefono'] || '').trim();
          const correo = String(row['CORREO'] || row['correo'] || '').trim();

          const cedulaLimpia = rawCedula.replace(/-/g, '');
          let esValido = true;
          let motivo = 'Válido';

          if (!cedulaLimpia) {
            esValido = false;
            motivo = 'Cédula no proporcionada';
          } else if (cedulaLimpia.length !== 10) {
            esValido = false;
            motivo = `Longitud inválida (${cedulaLimpia.length} dígitos)`;
          }

          if (esValido) validos++;
          else invalidos++;

          previsualizacion.push({
            fila: index + 2,
            cedula: cedulaLimpia,
            dependencia: dependencia || 'BAR / PROVEEDOR',
            cargo: cargo || 'INVITADO',
            telefono,
            correo,
            valido: esValido,
            motivo,
          });
        });

        this.filasPrevia.set(previsualizacion);
        this.totalValidos.set(validos);
        this.totalInvalidos.set(invalidos);

        this.messageService.add({
          severity: 'info',
          summary: 'Archivo leído',
          detail: `Se detectaron ${previsualizacion.length} registros (${validos} válidos, ${invalidos} con advertencias).`,
        });
      } catch (err: any) {
        console.error('Error al leer Excel:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error de lectura',
          detail: 'No se pudo procesar el archivo Excel. Verifique el formato.',
        });
      }
    };
    reader.readAsArrayBuffer(file);
  }

  ejecutarCargaMasiva() {
    const validos = this.filasPrevia().filter((f) => f.valido);
    if (validos.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Sin registros válidos',
        detail: 'No hay filas con cédulas válidas para procesar.',
      });
      return;
    }

    this.processingMasivo.set(true);
    this.progresoMasivo.set(30);
    const adminInfo = this.swCas.getUserInfo();

    const lista = validos.map((v) => ({
      strCedula: v.cedula,
      strDepencia: v.dependencia,
      strCargo: v.cargo,
      strTelefono: v.telefono,
      strCorreo: v.correo,
      mesesVigencia: this.mesesVigenciaMasivo || 6,
    }));

    this.adminService
      .cargaMasivaInvitados({
        lista,
        mesesVigencia: this.mesesVigenciaMasivo,
        adminInfo,
      })
      .subscribe({
        next: (res) => {
          this.progresoMasivo.set(100);
          this.processingMasivo.set(false);
          this.resultadoLote.set(res.data);
          this.messageService.add({
            severity: 'success',
            summary: 'Lote Completado',
            detail: res.message || 'Se procesó la carga masiva de invitados exitosamente.',
          });
          this.cargarInvitados();
        },
        error: (err) => {
          this.processingMasivo.set(false);
          this.progresoMasivo.set(0);
          this.messageService.add({
            severity: 'error',
            summary: 'Error en lote',
            detail: err.error?.message || 'Ocurrió un error al procesar la carga masiva.',
          });
        },
      });
  }

  descargarReporteResultados() {
    const res = this.resultadoLote();
    if (!res || !res.detalles) return;

    const dataReporte = res.detalles.map((d: any) => ({
      CEDULA: d.cedula,
      ESTADO: d.estado,
      DETALLE: d.mensaje,
      NOMBRE: d.datos ? `${d.datos.strNombres} ${d.datos.strApellidos}` : 'N/A',
      LOCAL_O_BAR: d.datos ? d.datos.strDepencia : 'N/A',
      FECHA_EXPIRACION_CARNET: d.datos ? d.datos.dtFecha_Fin : 'N/A',
    }));

    const ws = XLSX.utils.json_to_sheet(dataReporte);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Resultado_Lote');
    XLSX.writeFile(wb, `Reporte_Carga_Invitados_${Date.now()}.xlsx`);
  }

  getSeverityVigencia(estado: string): 'success' | 'warn' | 'danger' | 'secondary' {
    switch (estado) {
      case 'ACTIVO':
        return 'success';
      case 'VENCIDO':
        return 'danger';
      case 'DESACTIVADO':
        return 'secondary';
      default:
        return 'warn';
    }
  }
}
