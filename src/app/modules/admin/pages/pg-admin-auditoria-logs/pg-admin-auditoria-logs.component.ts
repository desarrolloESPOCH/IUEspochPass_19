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
  IAuditoriaLog,
  IResumenAuditoria,
} from '../../../../services/admin/AdminCarnets.service';

@Component({
  selector: 'app-pg-admin-auditoria-logs',
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
  templateUrl: './pg-admin-auditoria-logs.component.html',
  styleUrl: './pg-admin-auditoria-logs.component.css',
})
export default class PgAdminAuditoriaLogsComponent implements OnInit {
  private adminService = inject(AdminCarnetsService);
  private messageService = inject(MessageService);

  // Estados
  loading = signal<boolean>(false);
  exporting = signal<boolean>(false);

  // Datos
  logs = signal<IAuditoriaLog[]>([]);
  totales = signal<IResumenAuditoria>({
    total: 0,
    totalHoy: 0,
    totalCarnets: 0,
    totalRoles: 0,
    totalPersonas: 0,
  });

  // Paginación
  page = signal<number>(1);
  limit = signal<number>(20);
  totalRecords = signal<number>(0);

  // Filtros
  filtroBusqueda: string = '';
  filtroFechaInicio: string = '';
  filtroFechaFin: string = '';
  filtroTipoAccion: string = 'TODOS';

  // Modal Detalle
  modalDetalleVisible = signal<boolean>(false);
  logSeleccionado = signal<IAuditoriaLog | null>(null);

  // Opciones de tipos de acción
  tiposAccionOpciones = [
    { label: 'Todas las acciones', value: 'TODOS' },
    { label: '🪪 Gestión de Carnets (Activar/Renovar)', value: 'CARNET' },
    { label: '👥 Asignación de Roles / Dependencias / Datos', value: 'ROLES' },
    { label: '👮 Gestión de Guardias', value: 'GUARDIAS' },
    { label: '🏷️ Gestión de Invitados / Bares', value: 'INVITADOS' },
    { label: '📦 Cargas Masivas de Usuarios', value: 'MASIVO' },
  ];

  ngOnInit(): void {
    this.establecerRangoRapido('mes', false);
    this.cargarLogs(1);
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
      this.cargarLogs(1);
    }
  }

  private formatoFechaISO(date: Date): string {
    const anio = date.getFullYear();
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const dia = String(date.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
  }

  cargarLogs(pagina: number = 1): void {
    this.loading.set(true);
    this.page.set(pagina);

    const params: any = {
      page: this.page(),
      limit: this.limit(),
      busqueda: this.filtroBusqueda.trim(),
      fechaInicio: this.filtroFechaInicio,
      fechaFin: this.filtroFechaFin,
      tipoAccion: this.filtroTipoAccion,
    };

    this.adminService.getAuditorias(params).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res && res.data) {
          this.logs.set(res.data);
          this.totalRecords.set(res.count || 0);
          if (res.totales) {
            this.totales.set(res.totales);
          }
        } else {
          this.logs.set([]);
          this.totalRecords.set(0);
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err?.error?.message || 'Error al consultar logs de auditoría',
        });
      },
    });
  }

  limpiarFiltros(): void {
    this.filtroBusqueda = '';
    this.filtroTipoAccion = 'TODOS';
    this.establecerRangoRapido('mes', false);
    this.cargarLogs(1);
  }

  onPageChange(event: any): void {
    const nuevaPagina = Math.floor(event.first / event.rows) + 1;
    this.limit.set(event.rows);
    this.cargarLogs(nuevaPagina);
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
      tipoAccion: this.filtroTipoAccion,
    };

    this.adminService.getAuditorias(params).subscribe({
      next: (res) => {
        this.exporting.set(false);
        if (res && res.data && res.data.length > 0) {
          this.adminService.exportarExcelAuditorias(res.data, 'Logs_Auditoria_ESPOCH');
          this.messageService.add({
            severity: 'success',
            summary: 'Descarga Exitosa',
            detail: `Se exportaron ${res.data.length} logs de auditoría a Excel correctamente.`,
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

  verDetalle(log: IAuditoriaLog): void {
    this.logSeleccionado.set(log);
    this.modalDetalleVisible.set(true);
  }

  cerrarModalDetalle(): void {
    this.modalDetalleVisible.set(false);
    this.logSeleccionado.set(null);
  }

  getSeverityAccion(accion: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    const a = (accion || '').toUpperCase();
    if (a.includes('ACTIVAR') || a.includes('CREACION') || a.includes('CREAR') || a.includes('HABILITAR')) return 'success';
    if (a.includes('DESACTIVAR') || a.includes('DESHABILITAR') || a.includes('ELIMINAR')) return 'danger';
    if (a.includes('ROL') || a.includes('DEPENDENCIA') || a.includes('ACTUALIZAR')) return 'info';
    if (a.includes('RENOVAR')) return 'warn';
    if (a.includes('MASIV')) return 'contrast';
    return 'secondary';
  }

  getIconoAccion(accion: string): string {
    const a = (accion || '').toUpperCase();
    if (a.includes('CARNET') || a.includes('RENOVAR') || a.includes('ACTIVAR')) return 'pi pi-id-card';
    if (a.includes('ROL') || a.includes('DEPENDENCIA')) return 'pi pi-users';
    if (a.includes('GUARDIA')) return 'pi pi-shield';
    if (a.includes('INVITADO')) return 'pi pi-user-plus';
    if (a.includes('MASIV')) return 'pi pi-upload';
    return 'pi pi-info-circle';
  }
}
