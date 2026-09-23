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
import {
  AdminCarnetsService,
  IHistorialAcceso,
  IResumenHistorial,
} from '../../../../services/admin/AdminCarnets.service';

@Component({
  selector: 'app-pg-admin-historial-accesos',
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
  ],
  providers: [MessageService],
  templateUrl: './pg-admin-historial-accesos.component.html',
  styleUrl: './pg-admin-historial-accesos.component.css',
})
export default class PgAdminHistorialAccesosComponent implements OnInit {
  private adminService = inject(AdminCarnetsService);
  private messageService = inject(MessageService);

  // Estados
  loading = signal<boolean>(false);
  exporting = signal<boolean>(false);

  // Datos
  accesos = signal<IHistorialAcceso[]>([]);
  totales = signal<IResumenHistorial>({
    total: 0,
    totalValidos: 0,
    totalInvalidos: 0,
    totalHoy: 0,
  });

  // Paginación
  page = signal<number>(1);
  limit = signal<number>(20);
  totalRecords = signal<number>(0);

  // Filtros
  filtroBusqueda: string = '';
  filtroFechaInicio: string = '';
  filtroFechaFin: string = '';
  filtroEstadoAcceso: string = 'TODOS';
  filtroRol: string = 'todos';
  filtroTipo: string = 'todos';

  // Modal de Detalle
  modalDetalleVisible = signal<boolean>(false);
  accesoSeleccionado = signal<IHistorialAcceso | null>(null);

  // Opciones de combos
  estadosAccesoOpciones = [
    { label: 'Todos los estados', value: 'TODOS' },
    { label: '✅ Solo Válidos / Permitidos', value: '1' },
    { label: '❌ Solo No Válidos / Denegados', value: '0' },
  ];

  rolesOpciones = [
    { label: 'Todos los roles', value: 'todos' },
    { label: 'Estudiante', value: '3' },
    { label: 'Docente', value: '2' },
    { label: 'Servidor Politécnico', value: '1' },
    { label: 'Guardia', value: '6' },
    { label: 'Invitado / Bar', value: '7' },
    { label: 'Gestión', value: '11' },
    { label: 'Vinculación', value: '13' },
  ];

  tiposMovimientoOpciones = [
    { label: 'Todos los tipos', value: 'todos' },
    { label: 'Entrada', value: '1' },
    { label: 'Salida', value: '2' },
  ];

  ngOnInit(): void {
    this.establecerRangoRapido('hoy', false);
    this.cargarHistorial(1);
  }

  establecerRangoRapido(tipo: 'hoy' | 'semana' | 'mes' | 'todos', recargar: boolean = true): void {
    const hoy = new Date();
    const hoyStr = this.formatoFechaISO(hoy);

    if (tipo === 'hoy') {
      this.filtroFechaInicio = hoyStr;
      this.filtroFechaFin = hoyStr;
    } else if (tipo === 'semana') {
      const hace7Dias = new Date();
      hace7Dias.setDate(hoy.getDate() - 7);
      this.filtroFechaInicio = this.formatoFechaISO(hace7Dias);
      this.filtroFechaFin = hoyStr;
    } else if (tipo === 'mes') {
      const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      this.filtroFechaInicio = this.formatoFechaISO(inicioMes);
      this.filtroFechaFin = hoyStr;
    } else if (tipo === 'todos') {
      this.filtroFechaInicio = '';
      this.filtroFechaFin = '';
    }

    if (recargar) {
      this.cargarHistorial(1);
    }
  }

  private formatoFechaISO(date: Date): string {
    const anio = date.getFullYear();
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const dia = String(date.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
  }

  cargarHistorial(pagina: number = 1): void {
    this.loading.set(true);
    this.page.set(pagina);

    const params: any = {
      page: this.page(),
      limit: this.limit(),
      busqueda: this.filtroBusqueda.trim(),
      fechaInicio: this.filtroFechaInicio,
      fechaFin: this.filtroFechaFin,
      estadoAcceso: this.filtroEstadoAcceso,
      idRol: this.filtroRol,
      tipoRegistro: this.filtroTipo,
    };

    this.adminService.getHistorialAccesos(params).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res && res.data) {
          this.accesos.set(res.data);
          this.totalRecords.set(res.count || 0);
          if (res.totales) {
            this.totales.set(res.totales);
          }
        } else {
          this.accesos.set([]);
          this.totalRecords.set(0);
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err?.error?.message || 'Error al consultar el historial de accesos',
        });
      },
    });
  }

  limpiarFiltros(): void {
    this.filtroBusqueda = '';
    this.filtroEstadoAcceso = 'TODOS';
    this.filtroRol = 'todos';
    this.filtroTipo = 'todos';
    this.establecerRangoRapido('hoy', false);
    this.cargarHistorial(1);
  }

  onPageChange(event: any): void {
    const nuevaPagina = Math.floor(event.first / event.rows) + 1;
    this.limit.set(event.rows);
    this.cargarHistorial(nuevaPagina);
  }

  descargarExcel(): void {
    this.exporting.set(true);
    const params: any = {
      page: 1,
      limit: 10000,
      exportar: 'true',
      busqueda: this.filtroBusqueda.trim(),
      fechaInicio: this.filtroFechaInicio,
      fechaFin: this.filtroFechaFin,
      estadoAcceso: this.filtroEstadoAcceso,
      idRol: this.filtroRol,
      tipoRegistro: this.filtroTipo,
    };

    this.adminService.getHistorialAccesos(params).subscribe({
      next: (res) => {
        this.exporting.set(false);
        if (res && res.data && res.data.length > 0) {
          this.adminService.exportarExcelAccesos(res.data, 'Reporte_Accesos_ESPOCH');
          this.messageService.add({
            severity: 'success',
            summary: 'Descarga Exitosa',
            detail: `Se exportaron ${res.data.length} registros a Excel correctamente.`,
          });
        } else {
          this.messageService.add({
            severity: 'warn',
            summary: 'Sin Datos',
            detail: 'No existen registros para exportar con los filtros seleccionados.',
          });
        }
      },
      error: (err) => {
        this.exporting.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error al exportar',
          detail: err?.error?.message || 'No se pudo generar el archivo Excel.',
        });
      },
    });
  }

  verDetalle(acceso: IHistorialAcceso): void {
    this.accesoSeleccionado.set(acceso);
    this.modalDetalleVisible.set(true);
  }

  cerrarModalDetalle(): void {
    this.modalDetalleVisible.set(false);
    this.accesoSeleccionado.set(null);
  }

  getSeverityEstado(estado: number): 'success' | 'danger' | 'warn' {
    return estado === 1 ? 'success' : 'danger';
  }

  getSeverityRol(rol: string): 'info' | 'warn' | 'success' | 'secondary' | 'danger' | 'contrast' {
    const r = (rol || '').toUpperCase();
    if (r.includes('ESTUDIANTE')) return 'success';
    if (r.includes('DOCENTE')) return 'info';
    if (r.includes('SERVIDOR')) return 'contrast';
    if (r.includes('GUARDIA')) return 'warn';
    if (r.includes('INVITADO')) return 'secondary';
    return 'info';
  }
}
