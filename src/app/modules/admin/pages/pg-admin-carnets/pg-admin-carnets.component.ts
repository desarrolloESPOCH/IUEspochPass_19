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
import {
  AdminCarnetsService,
  ICarnetAdmin,
  IEstadisticasCarnet,
} from '../../../../services/admin/AdminCarnets.service';
import { SwCasService } from '../../../../utils/cas/sw-cas.service';

@Component({
  selector: 'app-pg-admin-carnets',
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
    DatePipe,
  ],
  providers: [MessageService],
  templateUrl: './pg-admin-carnets.component.html',
  styleUrl: './pg-admin-carnets.component.css',
})
export default class PgAdminCarnetsComponent implements OnInit {
  private adminService = inject(AdminCarnetsService);
  private messageService = inject(MessageService);
  private swCas = inject(SwCasService);

  // Estados
  loading = signal<boolean>(false);
  loadingPersona = signal<boolean>(false);
  saving = signal<boolean>(false);
  savingRolDep = signal<boolean>(false);

  // Datos de tabla y estadísticas
  carnets = signal<ICarnetAdmin[]>([]);
  totalRecords = signal<number>(0);
  estadisticas = signal<IEstadisticasCarnet>({
    resumen: {
      totalCarnets: 0,
      carnetsActivos: 0,
      carnetsVencidos: 0,
      carnetsDesactivados: 0,
    },
    distribucionRol: [],
  });

  // Filtros
  filtroBusqueda: string = '';
  filtroRol: any = 'todos';
  filtroVigencia: string = 'TODOS';
  page: number = 1;
  rows: number = 15;

  rolesList = signal<{ label: string; value: any }[]>([
    { label: 'Todos los roles', value: 'todos' },
  ]);

  estadosVigenciaList = [
    { label: 'Todos los estados', value: 'TODOS' },
    { label: 'Activos', value: 'ACTIVO' },
    { label: 'Vencidos', value: 'VENCIDO' },
    { label: 'Desactivados', value: 'DESACTIVADO' },
  ];

  // Búsqueda específica por cédula
  cedulaConsulta: string = '';
  personaEncontrada: any = null;
  mostrarPanelPersona = signal<boolean>(false);

  // Modal de Renovación / Prórroga (Por defecto 6 meses)
  dialogProrroga = signal<boolean>(false);
  carnetSeleccionado: any = null;
  tipoProrroga: '6' | '12' | 'custom' = '6';
  fechaPersonalizada: string = '';

  // Modal de Edición de Rol y Dependencia
  dialogEditarRolDep = signal<boolean>(false);
  rolSeleccionadoEdicion: any = null;
  dependenciaEdicion: string = '';
  cargoEdicion: string = '';

  ngOnInit() {
    this.cargarRoles();
    this.cargarEstadisticas();
    this.cargarCarnets();
  }

  cargarRoles() {
    this.adminService.getRoles().subscribe({
      next: (res) => {
        if (res && res.data) {
          const roles = res.data.map((r: any) => ({
            label: r.strNombre,
            value: r.intIdRol,
          }));
          this.rolesList.set([{ label: 'Todos los roles', value: 'todos' }, ...roles]);
        }
      },
      error: (err) => console.error('Error al cargar roles', err),
    });
  }

  cargarEstadisticas() {
    this.adminService.getEstadisticas().subscribe({
      next: (res) => {
        if (res && res.data) {
          this.estadisticas.set(res.data);
        }
      },
      error: (err) => console.error('Error al cargar estadísticas', err),
    });
  }

  cargarCarnets(event?: any) {
    this.loading.set(true);

    if (event) {
      this.page = Math.floor(event.first / event.rows) + 1;
      this.rows = event.rows;
    }

    const params = {
      busqueda: this.filtroBusqueda,
      idRol: this.filtroRol,
      estadoVigencia: this.filtroVigencia,
      page: this.page,
      limit: this.rows,
    };

    this.adminService.getCarnets(params).subscribe({
      next: (res) => {
        this.carnets.set(res.data || []);
        this.totalRecords.set(res.total || 0);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cargar el listado de carnets.',
        });
      },
    });
  }

  onFilterChange() {
    this.page = 1;
    this.cargarCarnets();
  }

  limpiarFiltros() {
    this.filtroBusqueda = '';
    this.filtroRol = 'todos';
    this.filtroVigencia = 'TODOS';
    this.page = 1;
    this.cargarCarnets();
  }

  // Buscar persona por cédula
  consultarPorCedula() {
    if (!this.cedulaConsulta || this.cedulaConsulta.trim() === '') {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atención',
        detail: 'Ingrese un número de cédula para consultar.',
      });
      return;
    }

    this.loadingPersona.set(true);
    this.adminService.getPersonaCarnet(this.cedulaConsulta.trim()).subscribe({
      next: (res) => {
        this.loadingPersona.set(false);
        if (res && res.data && res.data.length > 0) {
          this.personaEncontrada = res.data[0];
          this.mostrarPanelPersona.set(true);
        } else {
          this.personaEncontrada = null;
          this.mostrarPanelPersona.set(false);
          this.messageService.add({
            severity: 'info',
            summary: 'No encontrado',
            detail: 'No se encontró ninguna persona con la cédula ingresada.',
          });
        }
      },
      error: (err) => {
        this.loadingPersona.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error al consultar la persona por cédula.',
        });
      },
    });
  }

  cerrarPanelPersona() {
    this.mostrarPanelPersona.set(false);
    this.personaEncontrada = null;
  }

  // Cambiar estado Activo / Desactivado con Auditoría
  cambiarEstado(carnet: ICarnetAdmin) {
    const nuevoEstado = carnet.estadoCarnet === 1 ? 0 : 1;
    const accion = nuevoEstado === 1 ? 'activar' : 'desactivar';
    const adminInfo = this.swCas.getUserInfo();

    this.adminService.cambiarEstado(carnet.intIdCarnet, nuevoEstado, adminInfo).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: `Carnet ${accion === 'activar' ? 'habilitado' : 'deshabilitado'} correctamente.`,
        });
        this.cargarEstadisticas();
        this.cargarCarnets();
        if (this.personaEncontrada && this.personaEncontrada.intIdCarnet === carnet.intIdCarnet) {
          this.personaEncontrada.estadoCarnet = nuevoEstado;
          this.personaEncontrada.estadoVigencia = nuevoEstado === 1 ? 'ACTIVO' : 'DESACTIVADO';
        }
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `No se pudo ${accion} el carnet.`,
        });
      },
    });
  }

  // Modal Prórroga / Activación (Por defecto 6 meses)
  abrirModalProrroga(carnet: any) {
    this.carnetSeleccionado = carnet;
    this.tipoProrroga = '6'; // Por defecto 6 meses según especificación del usuario
    const fechaDefault = new Date();
    fechaDefault.setMonth(fechaDefault.getMonth() + 6);
    this.fechaPersonalizada = fechaDefault.toISOString().slice(0, 10);
    this.dialogProrroga.set(true);
  }

  guardarProrroga() {
    if (!this.carnetSeleccionado) return;

    this.saving.set(true);
    const adminInfo = this.swCas.getUserInfo();

    let payload: any = {
      intIdCarnet: this.carnetSeleccionado.intIdCarnet,
      intIdPersona: this.carnetSeleccionado.intUsuario || this.carnetSeleccionado.intIdPersona,
      strCedula: this.carnetSeleccionado.strCedula,
      adminInfo: adminInfo,
    };

    if (this.tipoProrroga === 'custom') {
      if (!this.fechaPersonalizada) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Fecha requerida',
          detail: 'Seleccione una fecha de vigencia válida.',
        });
        this.saving.set(false);
        return;
      }
      payload.dtFechaFin = new Date(this.fechaPersonalizada + 'T23:59:59').toISOString();
    } else {
      payload.mesesProrroga = parseInt(this.tipoProrroga);
    }

    this.adminService.renovarActivar(payload).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.dialogProrroga.set(false);
        const esNuevo = !this.carnetSeleccionado.intIdCarnet;
        this.messageService.add({
          severity: 'success',
          summary: esNuevo ? 'Carnet Creado y Activado' : 'Carnet Renovado',
          detail: esNuevo
            ? 'Se generó y activó exitosamente el nuevo carnet institucional.'
            : 'Se renovó y extendió la vigencia del carnet con éxito.',
        });
        this.cargarEstadisticas();
        this.cargarCarnets();
        if (this.mostrarPanelPersona()) {
          this.consultarPorCedula();
        }
      },
      error: (err) => {
        this.saving.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo procesar la activación o renovación del carnet.',
        });
      },
    });
  }

  // Modal Edición de Rol y Dependencia
  abrirModalEditarRolDep(persona: any) {
    this.personaEncontrada = persona;
    this.rolSeleccionadoEdicion = persona.intIdRol || null;
    this.dependenciaEdicion = persona.strDepencia || '';
    this.cargoEdicion = persona.strCargo || '';
    this.dialogEditarRolDep.set(true);
  }

  guardarRolDependencia() {
    if (!this.personaEncontrada || !this.personaEncontrada.intIdPersona) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atención',
        detail: 'No hay información válida de la persona.',
      });
      return;
    }

    if (!this.rolSeleccionadoEdicion) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Rol requerido',
        detail: 'Seleccione un rol institucional para la persona.',
      });
      return;
    }

    this.savingRolDep.set(true);
    const adminInfo = this.swCas.getUserInfo();

    const payload = {
      intPersona: this.personaEncontrada.intIdPersona,
      strCedula: this.personaEncontrada.strCedula,
      intRol: this.rolSeleccionadoEdicion,
      strDepencia: this.dependenciaEdicion.trim() || 'ESPOCH',
      strCargo: this.cargoEdicion.trim() || '',
      adminInfo: adminInfo,
    };

    this.adminService.actualizarRolDependencia(payload).subscribe({
      next: (res) => {
        this.savingRolDep.set(false);
        this.dialogEditarRolDep.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Rol y Dependencia Actualizados',
          detail: 'Se actualizaron correctamente el rol y la dependencia asignada.',
        });

        // Refrescar datos en el panel y en la tabla general
        this.consultarPorCedula();
        this.cargarEstadisticas();
        this.cargarCarnets();
      },
      error: (err) => {
        this.savingRolDep.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo actualizar el rol y la dependencia.',
        });
      },
    });
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
