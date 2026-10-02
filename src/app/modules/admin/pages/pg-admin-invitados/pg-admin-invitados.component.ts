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
  nombres: string;
  apellidos: string;
  dependencia: string;
  cargo: string;
  telefono: string;
  correo: string;
  valido: boolean;
  motivo: string;
  cargandoInfo?: boolean;
  origenInfo?: 'excel' | 'centralizada' | 'local' | 'no_encontrado' | 'pendiente';
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
  resolviendoCentralizada = signal<boolean>(false);
  filtroPrevia = signal<'TODOS' | 'VALIDOS' | 'INVALIDOS'>('TODOS');
  filtroResultado = signal<'TODOS' | 'EXITOSOS' | 'ERRORES'>('TODOS');
  resultadoLote = signal<any | null>(null);

  // ==============================
  // MODAL CAMBIAR CONTRASEÑA
  // ==============================
  dialogPassword = signal<boolean>(false);
  guardandoPassword = signal<boolean>(false);
  invitadoSeleccionadoPassword: IInvitadoAdmin | null = null;
  nuevaClave: string = '';
  correoNotificacionClave: string = '';
  notificarPorCorreo: boolean = true;

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
          this.nuevoNombres = (this.personaPreview.strNombres || '').trim();
          this.nuevoApellidos = (this.personaPreview.strApellidos || '').trim();
          const emailRaw = this.personaPreview.strCorreo;
          if (emailRaw && !['null', 'undefined', 'n/a', ''].includes(String(emailRaw).toLowerCase().trim())) {
            this.nuevoCorreo = String(emailRaw).trim();
          }
          const telRaw = this.personaPreview.strTelefono;
          if (telRaw && !['null', 'undefined', 'n/a', ''].includes(String(telRaw).toLowerCase().trim())) {
            this.nuevoTelefono = String(telRaw).trim();
          }
          if (this.personaPreview.strDepencia) {
            this.nuevoDependencia = this.personaPreview.strDepencia;
          }
        } else {
          this.messageService.add({
            severity: 'info',
            summary: 'Persona no registrada',
            detail: 'Complete los datos de la persona para el registro.',
          });
        }
      },
      error: () => {
        this.searchingPersona.set(false);
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

    const nombresFinal = (this.nuevoNombres || this.personaPreview?.strNombres || '').trim();
    const apellidosFinal = (this.nuevoApellidos || this.personaPreview?.strApellidos || '').trim();

    if (!nombresFinal || !apellidosFinal) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Campos requeridos',
        detail: 'Nombres y apellidos son requeridos para registrar al invitado.',
      });
      return;
    }

    const correoFinal = (this.nuevoCorreo || this.personaPreview?.strCorreo || '').trim();
    if (!correoFinal || correoFinal.toLowerCase() === 'n/a' || !correoFinal.includes('@')) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Correo personal requerido',
        detail: 'Ingrese un correo personal válido para enviar las credenciales de acceso al invitado.',
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
      strNombres: nombresFinal,
      strApellidos: apellidosFinal,
      strCorreo: correoFinal,
      strTelefono: (this.nuevoTelefono || '').trim(),
      strDepencia: this.nuevoDependencia.trim(),
      strCargo: this.nuevoCargo.trim() || 'INVITADO',
      mesesVigencia: this.mesesVigenciaIndividual || 6,
      adminInfo: adminInfo,
    };

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
    this.resolviendoCentralizada.set(false);
    this.filtroPrevia.set('TODOS');
    this.filtroResultado.set('TODOS');
    this.resultadoLote.set(null);
    this.dialogMasivo.set(true);
  }

  limpiarCargaMasiva() {
    this.archivoSeleccionado = null;
    this.nombreArchivo = '';
    this.filasPrevia.set([]);
    this.totalValidos.set(0);
    this.totalInvalidos.set(0);
    this.progresoMasivo.set(0);
    this.resolviendoCentralizada.set(false);
    this.filtroPrevia.set('TODOS');
    this.filtroResultado.set('TODOS');
    this.resultadoLote.set(null);
  }

  get filasPreviaFiltradas(): IFilaPreviaExcel[] {
    const filtro = this.filtroPrevia();
    const lista = this.filasPrevia();
    if (filtro === 'VALIDOS') return lista.filter((f) => f.valido);
    if (filtro === 'INVALIDOS') return lista.filter((f) => !f.valido);
    return lista;
  }

  get detallesResultadosFiltrados(): any[] {
    const res = this.resultadoLote();
    if (!res || !res.detalles) return [];
    const filtro = this.filtroResultado();
    if (filtro === 'EXITOSOS') return res.detalles.filter((d: any) => d.estado === 'Éxito');
    if (filtro === 'ERRORES') return res.detalles.filter((d: any) => d.estado !== 'Éxito');
    return res.detalles;
  }

  get totalResultadosExitosos(): number {
    const res = this.resultadoLote();
    if (!res || !res.detalles) return 0;
    return res.detalles.filter((d: any) => d.estado === 'Éxito').length;
  }

  get totalResultadosErrores(): number {
    const res = this.resultadoLote();
    if (!res || !res.detalles) return 0;
    return res.detalles.filter((d: any) => d.estado !== 'Éxito').length;
  }

  descargarPlantilla() {
    const encabezados = [
      ['CEDULA', 'NOMBRES', 'APELLIDOS', 'LOCAL_O_EMPRESA', 'CARGO', 'TELEFONO', 'CORREO'],
      ['1850575133', 'Carlos Eduardo', 'Sánchez López', 'Bar Facultad de Mecánica', 'Atención al Cliente', '0991234567', 'personal_bar@gmail.com'],
      ['0604172296', '', '', 'Distribuidora Lácteos San Pedro', 'Repartidor / Proveedor', '0987654321', 'proveedor@lacteos.com'],
    ];

    const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(encabezados);
    ws['!cols'] = [
      { wch: 15 },
      { wch: 25 },
      { wch: 25 },
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
    this.filtroPrevia.set('TODOS');
    this.filtroResultado.set('TODOS');

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
          const nombres = String(row['NOMBRES'] || row['nombres'] || row['Nombre'] || row['NOMBRE'] || '').trim();
          const apellidos = String(row['APELLIDOS'] || row['apellidos'] || row['Apellido'] || row['APELLIDO'] || '').trim();
          const dependencia = String(row['LOCAL_O_EMPRESA'] || row['EMPRESA'] || row['DEPENDENCIA'] || row['dependencia'] || row['Bar'] || 'BAR / PROVEEDOR').trim();
          const cargo = String(row['CARGO'] || row['cargo'] || 'INVITADO').trim();
          const telefono = String(row['TELEFONO'] || row['telefono'] || '').trim();
          const correo = String(row['CORREO'] || row['correo'] || '').trim();

          const cedulaLimpia = rawCedula.replace(/-/g, '').replace(/[\s']/g, '');
          let esValido = true;
          let motivo = 'Válido';
          let origen: 'excel' | 'centralizada' | 'local' | 'no_encontrado' | 'pendiente' = 'excel';
          let cargando = false;

          if (!cedulaLimpia) {
            esValido = false;
            motivo = 'Cédula no proporcionada';
            origen = 'no_encontrado';
          } else if (cedulaLimpia.length !== 10) {
            esValido = false;
            motivo = `Longitud de cédula inválida (${cedulaLimpia.length} dígitos)`;
            origen = 'no_encontrado';
          } else if (!correo || !correo.includes('@')) {
            esValido = false;
            motivo = 'Correo personal requerido / inválido';
          }

          const faltanNombres = !nombres || !apellidos;
          if (esValido && faltanNombres) {
            origen = 'pendiente';
            cargando = true;
          }

          if (esValido) validos++;
          else invalidos++;

          previsualizacion.push({
            fila: index + 2,
            cedula: cedulaLimpia,
            nombres: nombres || (faltanNombres && esValido ? 'Consultando...' : ''),
            apellidos: apellidos,
            dependencia: dependencia || 'BAR / PROVEEDOR',
            cargo: cargo || 'INVITADO',
            telefono,
            correo,
            valido: esValido,
            motivo,
            origenInfo: origen,
            cargandoInfo: cargando,
          });
        });

        this.filasPrevia.set(previsualizacion);
        this.totalValidos.set(validos);
        this.totalInvalidos.set(invalidos);

        const pendientes = previsualizacion.filter((f) => f.origenInfo === 'pendiente');
        if (pendientes.length > 0) {
          this.messageService.add({
            severity: 'info',
            summary: 'Consultando Centralizada',
            detail: `Se detectaron ${pendientes.length} invitados sin nombres. Sincronizando con Centralizada institucional...`,
          });
          this.resolverNombresCentralizada(previsualizacion);
        } else {
          this.messageService.add({
            severity: 'info',
            summary: 'Archivo leído',
            detail: `Se detectaron ${previsualizacion.length} registros (${validos} válidos, ${invalidos} con observaciones).`,
          });
        }
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

  async resolverNombresCentralizada(filas: IFilaPreviaExcel[]) {
    const pendientes = filas.filter((f) => f.origenInfo === 'pendiente');
    if (pendientes.length === 0) return;

    this.resolviendoCentralizada.set(true);

    for (const fila of pendientes) {
      try {
        // 1. Consultar si existe en base local
        const resLocal: any = await new Promise((resolve) => {
          this.adminService.getPersonaCarnet(fila.cedula, true).subscribe({
            next: (r) => resolve(r),
            error: () => resolve(null),
          });
        });

        if (resLocal && resLocal.data && resLocal.data.length > 0) {
          const p = resLocal.data[0];
          fila.nombres = (p.strNombres || '').trim();
          fila.apellidos = (p.strApellidos || '').trim();
          fila.origenInfo = 'local';
          fila.cargandoInfo = false;
          if (fila.nombres && fila.apellidos) {
            fila.valido = (!fila.correo || !fila.correo.includes('@')) ? false : true;
            fila.motivo = fila.valido ? 'Válido (BD Local)' : 'Correo personal requerido / inválido';
          }
          this.actualizarTotalesFilas(filas);
          continue;
        }

        // 2. Si no está local, consultar Centralizada
        const resCent: any = await new Promise((resolve) => {
          this.adminService.obtenerPersonaCentralizada(fila.cedula).subscribe({
            next: (r) => resolve(r),
            error: () => resolve(null),
          });
        });

        if (resCent && resCent.success && resCent.listado && resCent.listado.length > 0) {
          const din = resCent.listado[0];
          const nombresDin = (din.per_nombres || din.per_nombre || [din.per_primerNombre, din.per_segundoNombre].map((n: any) => (n || '').trim()).filter((n: string) => n.length > 0).join(' ') || '').trim();
          const apellidosDin = ([din.per_primerApellido, din.per_segundoApellido].map((a: any) => (a || '').trim()).filter((a: string) => a.length > 0).join(' ') || (din.per_apellidos || '').trim()).trim();

          fila.nombres = nombresDin;
          fila.apellidos = apellidosDin;
          fila.origenInfo = 'centralizada';
          fila.cargandoInfo = false;

          if (fila.nombres && fila.apellidos) {
            fila.valido = (!fila.correo || !fila.correo.includes('@')) ? false : true;
            fila.motivo = fila.valido ? 'Válido (Centralizada)' : 'Correo personal requerido / inválido';
          }
        } else {
          // No se encontró en Centralizada ni en BD local
          fila.nombres = '';
          fila.apellidos = '';
          fila.origenInfo = 'no_encontrado';
          fila.cargandoInfo = false;
          fila.valido = false;
          fila.motivo = 'No encontrado en Centralizada (requiere nombres en matriz)';
        }
      } catch {
        fila.cargandoInfo = false;
        fila.origenInfo = 'no_encontrado';
        fila.valido = false;
        fila.motivo = 'Error al consultar Centralizada';
      }

      this.actualizarTotalesFilas(filas);
    }

    this.resolviendoCentralizada.set(false);
    this.messageService.add({
      severity: 'success',
      summary: 'Centralizada sincronizada',
      detail: 'Se completó la verificación de nombres de invitados desde la Centralizada institucional.',
    });
  }

  private actualizarTotalesFilas(filas: IFilaPreviaExcel[]) {
    this.filasPrevia.set([...filas]);
    this.totalValidos.set(filas.filter((f) => f.valido).length);
    this.totalInvalidos.set(filas.filter((f) => !f.valido).length);
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
      strNombres: v.nombres,
      strApellidos: v.apellidos,
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
          this.filtroResultado.set('TODOS');
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
      NOMBRE: d.datos ? `${d.datos.strNombres || ''} ${d.datos.strApellidos || ''}`.trim() : 'N/A',
      LOCAL_O_BAR: d.datos ? d.datos.strDepencia || 'N/A' : 'N/A',
      CORREO: d.datos ? d.datos.strCorreo || 'N/A' : 'N/A',
      FECHA_EXPIRACION_CARNET: d.datos ? d.datos.dtFecha_Fin || 'N/A' : 'N/A',
    }));

    const ws = XLSX.utils.json_to_sheet(dataReporte);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Resultado_Lote_Invitados');
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

  // ==========================================
  // CAMBIO DE CONTRASEÑA
  // ==========================================

  abrirModalPassword(invitado: IInvitadoAdmin) {
    this.invitadoSeleccionadoPassword = invitado;
    this.correoNotificacionClave = invitado.strCorreo && invitado.strCorreo !== 'N/A' ? invitado.strCorreo : '';
    this.nuevaClave = this.generarPasswordAleatorio();
    this.notificarPorCorreo = true;
    this.dialogPassword.set(true);
  }

  generarPasswordAleatorio(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  generarNuevaClaveManual() {
    this.nuevaClave = this.generarPasswordAleatorio();
  }

  guardarPassword() {
    if (!this.invitadoSeleccionadoPassword) return;

    if (!this.nuevaClave || this.nuevaClave.trim().length < 4) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Contraseña no válida',
        detail: 'La contraseña debe tener al menos 4 caracteres.',
      });
      return;
    }

    if (this.notificarPorCorreo && (!this.correoNotificacionClave || !this.correoNotificacionClave.includes('@'))) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Correo inválido',
        detail: 'Ingrese un correo electrónico válido para enviar las credenciales.',
      });
      return;
    }

    this.guardandoPassword.set(true);
    const adminInfo = this.swCas.getUserInfo();

    this.adminService
      .cambiarPassword({
        strCedula: this.invitadoSeleccionadoPassword.strCedula,
        nuevaClave: this.nuevaClave.trim(),
        strCorreo: this.correoNotificacionClave.trim(),
        strNombres: `${this.invitadoSeleccionadoPassword.strNombres} ${this.invitadoSeleccionadoPassword.strApellidos}`.trim(),
        rol: this.invitadoSeleccionadoPassword.strDepencia || 'BAR / PROVEEDOR',
        notificarCorreo: this.notificarPorCorreo,
        adminInfo,
      })
      .subscribe({
        next: (res) => {
          this.guardandoPassword.set(false);
          this.dialogPassword.set(false);
          this.messageService.add({
            severity: 'success',
            summary: 'Contraseña Actualizada',
            detail: res.message || 'La contraseña ha sido actualizada exitosamente.',
          });
          this.cargarInvitados();
        },
        error: (err) => {
          this.guardandoPassword.set(false);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: err.error?.message || 'No se pudo actualizar la contraseña.',
          });
        },
      });
  }
}
