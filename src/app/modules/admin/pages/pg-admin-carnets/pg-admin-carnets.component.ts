// cspell:disable
import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { MultiSelect } from 'primeng/multiselect';
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
    MultiSelect,
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
  rolesEdicionList = signal<{ label: string; value: any }[]>([]);

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

  // Modal de Detalles de Todos los Carnets de la Persona
  dialogDetallesCarnets = signal<boolean>(false);
  loadingDetalles = signal<boolean>(false);
  carnetsPersonaList = signal<any[]>([]);
  personaSeleccionadaDetalle: any = null;

  // Modal de Renovación / Prórroga (Por defecto 6 meses)
  dialogProrroga = signal<boolean>(false);
  carnetSeleccionado: any = null;
  tipoProrroga: '6' | '12' | 'custom' = '6';
  fechaPersonalizada: string = '';

  // Modal de Edición de Rol y Dependencia
  dialogEditarRolDep = signal<boolean>(false);
  rolesSeleccionadosEdicion: number[] = [];
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
          this.rolesEdicionList.set(roles);
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
          const first = res.data[0];
          const rolesValidos = first.roles || res.data.filter((r: any) => r.intIdRol != null);
          const rolesIds = first.rolesIds || rolesValidos.map((r: any) => r.intIdRol);
          const rolesNombres = first.rol || rolesValidos.map((r: any) => r.rol).join(', ');

          this.personaEncontrada = {
            ...first,
            roles: rolesValidos,
            rolesIds: rolesIds,
            rol: rolesNombres || first.rol || 'SIN ROL',
          };
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
        if (this.dialogDetallesCarnets() && this.personaSeleccionadaDetalle) {
          this.cargarCarnetsPersona(this.personaSeleccionadaDetalle.intIdPersona || this.personaSeleccionadaDetalle.intUsuario || this.personaSeleccionadaDetalle.strCedula);
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

  // Modal Ver Más Detalles / Todos los Carnets de la Persona
  abrirModalDetalles(persona: any) {
    const idPersona = persona.intUsuario || persona.intIdPersona || persona.strCedula;
    this.personaSeleccionadaDetalle = {
      ...persona,
      intIdPersona: persona.intUsuario || persona.intIdPersona,
    };
    this.dialogDetallesCarnets.set(true);
    this.cargarCarnetsPersona(idPersona);
  }

  cargarCarnetsPersona(idPersona: number | string) {
    this.loadingDetalles.set(true);
    this.adminService.getCarnetsPorPersona(idPersona).subscribe({
      next: (res) => {
        this.carnetsPersonaList.set(res.data || []);
        this.loadingDetalles.set(false);
      },
      error: () => {
        this.carnetsPersonaList.set([]);
        this.loadingDetalles.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cargar el historial de carnets de la persona.',
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
        if (this.dialogDetallesCarnets() && this.personaSeleccionadaDetalle) {
          this.cargarCarnetsPersona(this.personaSeleccionadaDetalle.intIdPersona || this.personaSeleccionadaDetalle.intUsuario || this.personaSeleccionadaDetalle.strCedula);
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
    const idPersona = persona.intUsuario || persona.intIdPersona;
    this.personaEncontrada = {
      ...persona,
      intIdPersona: idPersona,
    };

    if (persona.rolesIds && Array.isArray(persona.rolesIds) && persona.rolesIds.length > 0) {
      this.rolesSeleccionadosEdicion = [...persona.rolesIds];
    } else if (persona.intIdRol) {
      this.rolesSeleccionadosEdicion = [persona.intIdRol];
    } else {
      this.rolesSeleccionadosEdicion = [];
    }

    this.dependenciaEdicion = persona.strDepencia || '';
    this.cargoEdicion = persona.strCargo || '';
    this.dialogEditarRolDep.set(true);

    // Consultar todos los roles activos que tenga registrados en la base de datos
    if (persona.strCedula) {
      this.adminService.getPersonaCarnet(persona.strCedula, true).subscribe({
        next: (res) => {
          if (res && res.data && res.data.length > 0) {
            const data = res.data[0];
            const rolesValidos = data.roles || res.data.filter((r: any) => r.intIdRol != null);
            const rolesIds = data.rolesIds || rolesValidos.map((r: any) => r.intIdRol);
            if (rolesIds && rolesIds.length > 0) {
              this.rolesSeleccionadosEdicion = [...rolesIds];
              this.personaEncontrada.rolesIds = rolesIds;
              this.personaEncontrada.roles = rolesValidos;
            }
          }
        },
        error: () => {},
      });
    }
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

    if (!this.rolesSeleccionadosEdicion || this.rolesSeleccionadosEdicion.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Roles requeridos',
        detail: 'Seleccione al menos un rol institucional para la persona.',
      });
      return;
    }

    this.savingRolDep.set(true);
    const adminInfo = this.swCas.getUserInfo();

    const payload = {
      intPersona: this.personaEncontrada.intIdPersona,
      strCedula: this.personaEncontrada.strCedula,
      roles: this.rolesSeleccionadosEdicion,
      intRol: this.rolesSeleccionadosEdicion[0], // fallback para compatibilidad
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
          summary: 'Roles y Dependencia Actualizados',
          detail: 'Se actualizaron correctamente los roles y la dependencia asignada.',
        });

        // Refrescar datos en el panel y en la tabla general
        if (this.mostrarPanelPersona()) {
          this.consultarPorCedula();
        }
        this.cargarEstadisticas();
        this.cargarCarnets();
      },
      error: (err) => {
        this.savingRolDep.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo actualizar los roles y la dependencia.',
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
