// cspell:disable
import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  IGuardiaAdmin,
} from '../../../../services/admin/AdminCarnets.service';
import { SwCasService } from '../../../../utils/cas/sw-cas.service';

export interface IFilaPreviaExcelGuardia {
  fila: number;
  cedula: string;
  nombres: string;
  apellidos: string;
  telefono: string;
  correo: string;
  valido: boolean;
  motivo: string;
}

@Component({
  selector: 'app-pg-admin-guardias',
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
  ],
  providers: [MessageService],
  templateUrl: './pg-admin-guardias.component.html',
  styleUrl: './pg-admin-guardias.component.css',
})
export default class PgAdminGuardiasComponent implements OnInit {
  private adminService = inject(AdminCarnetsService);
  private messageService = inject(MessageService);
  private swCas = inject(SwCasService);

  // Estados
  loading = signal<boolean>(false);
  saving = signal<boolean>(false);
  searchingPersona = signal<boolean>(false);

  // Listado y métricas
  guardias = signal<IGuardiaAdmin[]>([]);
  totalGuardias = signal<number>(0);
  activosCount = signal<number>(0);
  desactivadosCount = signal<number>(0);

  // Filtros
  filtroBusqueda: string = '';
  filtroEstado: string = 'TODOS';

  estadosList = [
    { label: 'Todos los estados', value: 'TODOS' },
    { label: 'Habilitados (Activos)', value: '1' },
    { label: 'Deshabilitados (Inactivos)', value: '0' },
  ];

  // Modal Agregar Guardia
  dialogAgregar = signal<boolean>(false);
  cedulaNuevoGuardia: string = '';
  personaPreview: any = null;
  nuevoNombres: string = '';
  nuevoApellidos: string = '';
  nuevoCorreo: string = '';
  nuevoTelefono: string = '';
  mostrarCamposManuales = signal<boolean>(false);

  // Modal Cambiar Contraseña
  dialogPassword = signal<boolean>(false);
  guardandoPassword = signal<boolean>(false);
  guardiaSeleccionadoPassword: IGuardiaAdmin | null = null;
  nuevaClave: string = '';
  correoNotificacionClave: string = '';
  notificarPorCorreo: boolean = true;

  // ==============================
  // MODAL CARGA MASIVA EXCEL
  // ==============================
  dialogMasivo = signal<boolean>(false);
  archivoSeleccionado: File | null = null;
  nombreArchivo: string = '';
  filasPrevia = signal<IFilaPreviaExcelGuardia[]>([]);
  totalValidos = signal<number>(0);
  totalInvalidos = signal<number>(0);
  progresoMasivo = signal<number>(0);
  processingMasivo = signal<boolean>(false);
  resultadoLote = signal<any | null>(null);

  ngOnInit() {
    this.cargarGuardias();
  }

  private normalizarContacto(valor?: string | null): string {
    if (!valor) return 'N/A';
    const trimmed = String(valor).trim();
    if (
      !trimmed ||
      trimmed === '-' ||
      trimmed.toUpperCase() === 'NULL' ||
      trimmed.toUpperCase() === 'UNDEFINED' ||
      trimmed.toUpperCase() === 'N/A' ||
      trimmed.toUpperCase() === 'S/N' ||
      trimmed.toUpperCase() === 'NINGUNO' ||
      trimmed.toUpperCase() === 'NONE'
    ) {
      return 'N/A';
    }
    return trimmed;
  }

  cargarGuardias() {
    this.loading.set(true);
    const params: any = {
      busqueda: this.filtroBusqueda,
    };
    if (this.filtroEstado !== 'TODOS') {
      params.estado = this.filtroEstado;
    }

    this.adminService.getGuardias(params).subscribe({
      next: (res) => {
        const rawList = res.data || [];
        const list = rawList.map((g) => ({
          ...g,
          strCorreo: this.normalizarContacto(g.strCorreo),
          strTelefono: this.normalizarContacto(g.strTelefono),
        }));
        this.guardias.set(list);
        this.totalGuardias.set(list.length);
        this.activosCount.set(list.filter((g) => g.estadoGuardia === 1).length);
        this.desactivadosCount.set(list.filter((g) => g.estadoGuardia === 0).length);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cargar el listado de guardias.',
        });
      },
    });
  }

  limpiarFiltros() {
    this.filtroBusqueda = '';
    this.filtroEstado = 'TODOS';
    this.cargarGuardias();
  }

  // Cambiar Estado (Habilitar / Deshabilitar)
  cambiarEstado(guardia: IGuardiaAdmin) {
    const nuevoEstado = guardia.estadoGuardia === 1 ? 0 : 1;
    const accion = nuevoEstado === 1 ? 'habilitar' : 'deshabilitar';
    const adminInfo = this.swCas.getUserInfo();

    this.adminService.cambiarEstadoGuardia(guardia.intPersona, nuevoEstado, adminInfo).subscribe({
      next: () => {

        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: `Guardia ${accion === 'habilitar' ? 'habilitado' : 'deshabilitado'} correctamente.`,
        });
        this.cargarGuardias();
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `No se pudo ${accion} al guardia.`,
        });
      },
    });
  }

  // Modal Agregar Guardia
  abrirModalAgregar() {
    this.cedulaNuevoGuardia = '';
    this.personaPreview = null;
    this.nuevoNombres = '';
    this.nuevoApellidos = '';
    this.nuevoCorreo = '';
    this.nuevoTelefono = '';
    this.mostrarCamposManuales.set(false);
    this.dialogAgregar.set(true);
  }

  buscarPersonaPorCedula() {
    if (!this.cedulaNuevoGuardia || this.cedulaNuevoGuardia.trim() === '') {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atención',
        detail: 'Ingrese un número de cédula válido.',
      });
      return;
    }

    const cedulaLimpia = this.cedulaNuevoGuardia.trim().replace(/[\s-]/g, '').replace(/['"]/g, '');
    this.searchingPersona.set(true);
    this.personaPreview = null;
    this.mostrarCamposManuales.set(false);
    this.nuevoNombres = '';
    this.nuevoApellidos = '';
    this.nuevoCorreo = '';
    this.nuevoTelefono = '';

    // 1. Consultar si la persona ya está registrada localmente
    this.adminService.getPersonaCarnet(cedulaLimpia, true).subscribe({
      next: (res) => {
        if (res && res.data && res.data.length > 0) {
          this.searchingPersona.set(false);
          const persona = res.data[0];

          const correo = this.normalizarContacto(persona.strCorreo);
          const telefono = this.normalizarContacto(persona.strTelefono);

          this.personaPreview = {
            ...persona,
            strCorreo: correo,
            strTelefono: telefono,
            origen: 'local',
          };

          this.nuevoNombres = (persona.strNombres || '').trim();
          this.nuevoApellidos = (persona.strApellidos || '').trim();
          this.nuevoCorreo = correo;
          this.nuevoTelefono = telefono;
          this.mostrarCamposManuales.set(true);

          this.messageService.add({
            severity: 'success',
            summary: 'Persona Registrada',
            detail: 'La persona se encuentra registrada en el sistema local.',
          });
        } else {
          // Si no está registrado en el sistema local, consultar Centralizada institucional
          this.consultarCentralizada(cedulaLimpia);
        }
      },
      error: () => {
        // En caso de error local, intentar consultar en la Centralizada
        this.consultarCentralizada(cedulaLimpia);
      },
    });
  }

  private consultarCentralizada(cedula: string) {
    this.adminService.obtenerPersonaCentralizada(cedula).subscribe({
      next: (resp) => {
        this.searchingPersona.set(false);
        if (resp && resp.success && resp.listado && resp.listado.length > 0) {
          const din = resp.listado[0];

          this.nuevoNombres = (din.per_nombres || din.per_nombre || [din.per_primerNombre, din.per_segundoNombre].map((n: any) => (n || '').trim()).filter((n: string) => n.length > 0).join(' ') || '').trim();
          const apellidos = [din.per_primerApellido, din.per_segundoApellido]
            .map((a: any) => (a || '').trim())
            .filter((a: string) => a.length > 0)
            .join(' ') || (din.per_apellidos || '').trim();
          this.nuevoApellidos = apellidos;

          const emailRaw = [din.per_email, din.per_correo]
            .map((e: any) => (e ? String(e).trim() : ''))
            .find((e: string) => e.length > 0);
          const correo = this.normalizarContacto(emailRaw);
          this.nuevoCorreo = correo;

          const telRaw = [din.per_telefonoCelular, din.per_telefonoCasa, din.per_telefono]
            .map((t: any) => (t ? String(t).trim() : ''))
            .find((t: string) => t.length > 0);
          const telefono = this.normalizarContacto(telRaw);
          this.nuevoTelefono = telefono;

          this.personaPreview = {
            strCedula: cedula,
            strNombres: this.nuevoNombres,
            strApellidos: this.nuevoApellidos,
            strCorreo: this.nuevoCorreo,
            strTelefono: this.nuevoTelefono,
            rol: 'Centralizada Institucional',
            origen: 'centralizada',
          };

          this.mostrarCamposManuales.set(true);

          this.messageService.add({
            severity: 'success',
            summary: 'Datos de Centralizada',
            detail: 'Se autocompletaron los datos de la persona desde la Centralizada institucional.',
          });
        } else {
          this.mostrarCamposManuales.set(true);
          this.nuevoCorreo = 'N/A';
          this.nuevoTelefono = 'N/A';
          this.messageService.add({
            severity: 'info',
            summary: 'Persona no registrada',
            detail: 'No se encontraron datos en la Centralizada institucional. Complete los datos manualmente.',
          });
        }
      },
      error: () => {
        this.searchingPersona.set(false);
        this.mostrarCamposManuales.set(true);
        this.nuevoCorreo = 'N/A';
        this.nuevoTelefono = 'N/A';
        this.messageService.add({
          severity: 'warn',
          summary: 'Aviso',
          detail: 'No se pudo conectar a la Centralizada. Complete los datos manualmente.',
        });
      },
    });
  }

  guardarNuevoGuardia() {
    if (!this.cedulaNuevoGuardia || this.cedulaNuevoGuardia.trim() === '') {
      this.messageService.add({
        severity: 'warn',
        summary: 'Campo requerido',
        detail: 'Ingrese el número de cédula.',
      });
      return;
    }

    const cedulaLimpia = this.cedulaNuevoGuardia.trim().replace(/[\s-]/g, '').replace(/['"]/g, '');

    if (this.personaPreview && this.personaPreview.strCedula !== cedulaLimpia) {
      this.personaPreview = null;
      this.buscarPersonaPorCedula();
      return;
    }
    const nombresFinal = (this.nuevoNombres !== undefined && this.nuevoNombres !== null && this.nuevoNombres.trim() !== ''
      ? this.nuevoNombres
      : (this.personaPreview?.strNombres || '')).trim();
    const apellidosFinal = (this.nuevoApellidos !== undefined && this.nuevoApellidos !== null && this.nuevoApellidos.trim() !== ''
      ? this.nuevoApellidos
      : (this.personaPreview?.strApellidos || '')).trim();

    if (!nombresFinal || !apellidosFinal) {
      if (!this.personaPreview && !this.mostrarCamposManuales()) {
        this.buscarPersonaPorCedula();
        return;
      }
      this.mostrarCamposManuales.set(true);
      if (!this.nuevoCorreo) this.nuevoCorreo = 'N/A';
      if (!this.nuevoTelefono) this.nuevoTelefono = 'N/A';
      this.messageService.add({
        severity: 'warn',
        summary: 'Campos requeridos',
        detail: 'Nombres y apellidos son requeridos para registrar al guardia.',
      });
      return;
    }

    const correoFinal = this.normalizarContacto(
      this.nuevoCorreo !== undefined && this.nuevoCorreo !== null ? this.nuevoCorreo : this.personaPreview?.strCorreo
    );
    const telefonoFinal = this.normalizarContacto(
      this.nuevoTelefono !== undefined && this.nuevoTelefono !== null ? this.nuevoTelefono : this.personaPreview?.strTelefono
    );

    // Validación de correo personal obligatorio para envío de credenciales
    if (!correoFinal || correoFinal === 'N/A' || !correoFinal.includes('@')) {
      this.mostrarCamposManuales.set(true);
      this.messageService.add({
        severity: 'warn',
        summary: 'Correo personal requerido',
        detail: 'Por favor ingrese un correo electrónico válido para enviar las credenciales de acceso al guardia.',
      });
      return;
    }

    this.saving.set(true);
    const body: any = {
      strCedula: cedulaLimpia,
      strNombres: nombresFinal,
      strApellidos: apellidosFinal,
      strCorreo: correoFinal,
      strTelefono: telefonoFinal,
      adminInfo: this.swCas.getUserInfo(),
    };

    this.adminService.agregarGuardia(body).subscribe({

      next: (res) => {
        this.saving.set(false);
        if (res && res.count === -1) {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: res.message || 'No se pudo agregar al guardia.',
          });
          return;
        }
        this.dialogAgregar.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Guardia Registrado',
          detail: 'El usuario ha sido registrado y habilitado como Guardia correctamente.',
        });
        this.cargarGuardias();
      },
      error: (err) => {
        this.saving.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.message || 'No se pudo agregar al guardia.',
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
    this.progresoMasivo.set(0);
    this.resultadoLote.set(null);
    this.dialogMasivo.set(true);
  }

  descargarPlantilla() {
    const encabezados = [
      ['CEDULA', 'NOMBRES', 'APELLIDOS', 'TELEFONO', 'CORREO'],
      ['0604172296', 'Juan Carlos', 'Pérez Morales', '0991234567', 'guardia1@gmail.com'],
      ['0605987654', 'Manuel Alberto', 'López García', '0987654321', 'guardia2@gmail.com'],
    ];

    const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(encabezados);
    ws['!cols'] = [
      { wch: 15 },
      { wch: 25 },
      { wch: 25 },
      { wch: 15 },
      { wch: 30 },
    ];

    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Guardias_Seguridad');
    XLSX.writeFile(wb, 'Plantilla_Guardias_ESPOCH.xlsx');
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

        const previsualizacion: IFilaPreviaExcelGuardia[] = [];
        let validos = 0;
        let invalidos = 0;

        json.forEach((row: any, index: number) => {
          const rawCedula = String(row['CEDULA'] || row['cedula'] || row['Cedula'] || row['Cédula'] || '').trim();
          const nombres = String(row['NOMBRES'] || row['nombres'] || row['Nombre'] || row['NOMBRE'] || '').trim();
          const apellidos = String(row['APELLIDOS'] || row['apellidos'] || row['Apellido'] || row['APELLIDO'] || '').trim();
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
          } else if (!correo || !correo.includes('@')) {
            esValido = false;
            motivo = 'Correo personal requerido / inválido';
          }

          if (esValido) validos++;
          else invalidos++;

          previsualizacion.push({
            fila: index + 2,
            cedula: cedulaLimpia,
            nombres,
            apellidos,
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
        detail: 'No hay filas con datos válidos para procesar.',
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
      strTelefono: v.telefono,
      strCorreo: v.correo,
    }));

    this.adminService
      .cargaMasivaGuardias({
        lista,
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
            detail: res.message || 'Se procesó la carga masiva de guardias exitosamente.',
          });
          this.cargarGuardias();
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
      CORREO: d.datos ? d.datos.strCorreo : 'N/A',
    }));

    const ws = XLSX.utils.json_to_sheet(dataReporte);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Resultado_Lote_Guardias');
    XLSX.writeFile(wb, `Reporte_Carga_Guardias_${Date.now()}.xlsx`);
  }

  // ==========================================
  // CAMBIO DE CONTRASEÑA
  // ==========================================

  abrirModalPassword(guardia: IGuardiaAdmin) {
    this.guardiaSeleccionadoPassword = guardia;
    this.correoNotificacionClave = guardia.strCorreo && guardia.strCorreo !== 'N/A' ? guardia.strCorreo : '';
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
    if (!this.guardiaSeleccionadoPassword) return;

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
        strCedula: this.guardiaSeleccionadoPassword.strCedula,
        nuevaClave: this.nuevaClave.trim(),
        strCorreo: this.correoNotificacionClave.trim(),
        strNombres: `${this.guardiaSeleccionadoPassword.strNombres} ${this.guardiaSeleccionadoPassword.strApellidos}`.trim(),
        rol: 'GUARDIA DE SEGURIDAD',
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
          this.cargarGuardias();
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
