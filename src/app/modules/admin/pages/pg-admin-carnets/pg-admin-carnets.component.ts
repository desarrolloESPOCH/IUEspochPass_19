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
  filtroVigencia: string = 'ACTIVO';
  page: number = 1;
  rows: number = 15;

  rolesList = signal<{ label: string; value: any }[]>([
    { label: 'Todos los roles', value: 'todos' },
  ]);
  rolesEdicionList = signal<{ label: string; value: any }[]>([]);

  estadosVigenciaList = [
    { label: 'Activos', value: 'ACTIVO' },
    { label: 'Todos los estados', value: 'TODOS' },
    { label: 'Vencidos', value: 'VENCIDO' },
    { label: 'Desactivados', value: 'DESACTIVADO' },
  ];

  // Búsqueda por Cédula, Nombres o Apellidos
  busquedaTexto: string = '';
  personaEncontrada: any = null;
  mostrarPanelPersona = signal<boolean>(false);
  listaResultadosBusqueda = signal<any[]>([]);
  mostrarResultadosMultiples = signal<boolean>(false);
  busquedaRealizada = signal<boolean>(false);

  // Modal de Registro de Nueva Persona y Carnet
  dialogCrearPersona = signal<boolean>(false);
  savingNuevaPersona = signal<boolean>(false);
  buscandoDinardap = signal<boolean>(false);
  nuevaPersona: any = {
    strCedula: '',
    strNombres: '',
    strApellidos: '',
    strCorreo: '',
    strTelefono: '',
    roles: [3],
    strDepencia: 'ESPOCH',
    strCargo: '',
    tipoProrroga: '6',
    fechaPersonalizada: '',
  };

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

  refrescarVista() {
    this.cargarEstadisticas();
    if (this.mostrarPanelPersona() && this.personaEncontrada?.strCedula) {
      this.consultarPorCedula(this.personaEncontrada.strCedula);
    } else if (this.busquedaTexto) {
      this.ejecutarBusqueda();
    }
  }

  limpiarBusqueda() {
    this.busquedaTexto = '';
    this.personaEncontrada = null;
    this.mostrarPanelPersona.set(false);
    this.mostrarResultadosMultiples.set(false);
    this.listaResultadosBusqueda.set([]);
    this.busquedaRealizada.set(false);
  }

  // Buscar persona por cédula, nombres o apellidos
  ejecutarBusqueda() {
    if (!this.busquedaTexto || this.busquedaTexto.trim() === '') {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atención',
        detail: 'Ingrese un número de cédula, nombres o apellidos para buscar.',
      });
      return;
    }

    this.loadingPersona.set(true);
    this.busquedaRealizada.set(true);
    this.adminService.buscarPersonas(this.busquedaTexto.trim()).subscribe({
      next: (res) => {
        this.loadingPersona.set(false);
        const personas = res && res.data ? res.data : [];
        if (personas.length === 1) {
          this.personaEncontrada = personas[0];
          this.mostrarPanelPersona.set(true);
          this.mostrarResultadosMultiples.set(false);
          this.listaResultadosBusqueda.set([]);
        } else if (personas.length > 1) {
          this.listaResultadosBusqueda.set(personas);
          this.mostrarResultadosMultiples.set(true);
          this.mostrarPanelPersona.set(false);
          this.personaEncontrada = null;
        } else {
          this.personaEncontrada = null;
          this.mostrarPanelPersona.set(false);
          this.mostrarResultadosMultiples.set(false);
          this.listaResultadosBusqueda.set([]);
          this.messageService.add({
            severity: 'info',
            summary: 'No encontrado',
            detail: `No se encontraron resultados para "${this.busquedaTexto.trim()}". Puede registrarla con el botón "+ Nueva Persona".`,
          });
        }
      },
      error: (err) => {
        this.loadingPersona.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error al consultar personas en el sistema.',
        });
      },
    });
  }

  seleccionarPersona(persona: any) {
    this.personaEncontrada = persona;
    this.mostrarPanelPersona.set(true);
    this.mostrarResultadosMultiples.set(false);
  }

  consultarPorCedula(cedula?: string) {
    const targetCedula = cedula || this.personaEncontrada?.strCedula || (this.busquedaTexto && /^\d+$/.test(this.busquedaTexto.trim()) ? this.busquedaTexto.trim() : '');
    if (!targetCedula) return;
    this.adminService.getPersonaCarnet(targetCedula.trim()).subscribe({
      next: (res) => {
        if (res && res.data && res.data.length > 0) {
          this.personaEncontrada = res.data[0];
          this.mostrarPanelPersona.set(true);
        }
      },
      error: () => {},
    });
  }

  cerrarPanelPersona() {
    this.mostrarPanelPersona.set(false);
    this.personaEncontrada = null;
    if (this.listaResultadosBusqueda().length > 1) {
      this.mostrarResultadosMultiples.set(true);
    }
  }

  // Modal Registro de Nueva Persona
  abrirModalCrearPersona(cedulaPrevia: string = '') {
    const cedulaInicial = (cedulaPrevia || (this.busquedaTexto && /^\d+$/.test(this.busquedaTexto.trim()) ? this.busquedaTexto.trim() : '')).replace(/[\s-]/g, '');
    const defaultRol = this.rolesEdicionList().length > 0 ? [this.rolesEdicionList()[0].value] : [3];
    
    this.nuevaPersona = {
      strCedula: cedulaInicial,
      strNombres: '',
      strApellidos: '',
      strCorreo: '',
      strTelefono: '',
      roles: defaultRol,
      strDepencia: 'ESPOCH',
      strCargo: '',
      tipoProrroga: '6',
      fechaPersonalizada: '',
    };
    this.dialogCrearPersona.set(true);
    if (cedulaInicial && cedulaInicial.length === 10) {
      this.consultarDinardapCrear();
    }
  }

  consultarDinardapCrear() {
    if (!this.nuevaPersona.strCedula || this.nuevaPersona.strCedula.trim().length < 10) {
      return;
    }
    const cedula = this.nuevaPersona.strCedula.trim().replace(/[\s-]/g, '');
    this.buscandoDinardap.set(true);
    this.adminService.obtenerPersonaCentralizada(cedula).subscribe({
      next: (res) => {
        this.buscandoDinardap.set(false);
        if (res && res.success && res.listado && res.listado.length > 0) {
          const din = res.listado[0];
          this.nuevaPersona.strNombres = (din.per_nombres || din.per_nombre || '').trim();
          const apellidos = [din.per_primerApellido, din.per_segundoApellido]
            .map((a) => (a || '').trim())
            .filter((a) => a.length > 0)
            .join(' ') || (din.per_apellidos || '').trim();
          this.nuevaPersona.strApellidos = apellidos;
          const email = [din.per_email, din.per_correo].find((v) => v && v.length > 0);
          if (email && !['null', 'undefined', 'n/a'].includes(email.toLowerCase())) {
            this.nuevaPersona.strCorreo = email;
          }
          const tel = [din.per_telefonoCelular, din.per_telefonoCasa, din.per_telefono].find((v) => v && v.length > 0);
          if (tel && !['null', 'undefined', 'n/a'].includes(tel.toLowerCase())) {
            this.nuevaPersona.strTelefono = tel;
          }
          this.messageService.add({
            severity: 'success',
            summary: 'Datos recuperados',
            detail: 'Se autocompletaron los datos de DINARDAP / Centralizada.',
          });
        }
      },
      error: () => {
        this.buscandoDinardap.set(false);
      },
    });
  }

  guardarNuevaPersona() {
    if (!this.nuevaPersona.strCedula || this.nuevaPersona.strCedula.trim() === '') {
      this.messageService.add({ severity: 'warn', summary: 'Cédula requerida', detail: 'Ingrese el número de cédula.' });
      return;
    }
    if (!this.nuevaPersona.strNombres || this.nuevaPersona.strNombres.trim() === '') {
      this.messageService.add({ severity: 'warn', summary: 'Nombres requeridos', detail: 'Ingrese los nombres de la persona.' });
      return;
    }
    if (!this.nuevaPersona.strApellidos || this.nuevaPersona.strApellidos.trim() === '') {
      this.messageService.add({ severity: 'warn', summary: 'Apellidos requeridos', detail: 'Ingrese los apellidos de la persona.' });
      return;
    }
    if (!this.nuevaPersona.roles || this.nuevaPersona.roles.length === 0) {
      this.messageService.add({ severity: 'warn', summary: 'Roles requeridos', detail: 'Seleccione al menos un rol institucional.' });
      return;
    }

    this.savingNuevaPersona.set(true);
    const adminInfo = this.swCas.getUserInfo();

    let payload: any = {
      strCedula: this.nuevaPersona.strCedula.trim(),
      strNombres: this.nuevaPersona.strNombres.trim(),
      strApellidos: this.nuevaPersona.strApellidos.trim(),
      strCorreo: this.nuevaPersona.strCorreo?.trim() || 'N/A',
      strTelefono: this.nuevaPersona.strTelefono?.trim() || 'N/A',
      roles: this.nuevaPersona.roles,
      strDepencia: this.nuevaPersona.strDepencia?.trim() || 'ESPOCH',
      strCargo: this.nuevaPersona.strCargo?.trim() || '',
      adminInfo: adminInfo,
    };

    if (this.nuevaPersona.tipoProrroga === 'custom') {
      if (!this.nuevaPersona.fechaPersonalizada) {
        this.messageService.add({ severity: 'warn', summary: 'Fecha requerida', detail: 'Seleccione una fecha de vigencia válida.' });
        this.savingNuevaPersona.set(false);
        return;
      }
      payload.dtFechaFin = new Date(this.nuevaPersona.fechaPersonalizada + 'T23:59:59').toISOString();
    } else {
      payload.mesesVigencia = parseInt(this.nuevaPersona.tipoProrroga);
    }

    this.adminService.agregarPersona(payload).subscribe({
      next: (res) => {
        this.savingNuevaPersona.set(false);
        this.dialogCrearPersona.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Persona Registrada',
          detail: 'Se registró a la persona y se activó su carnet institucional con éxito.',
        });
        this.cargarEstadisticas();
        if (res && res.data && res.data.length > 0) {
          this.personaEncontrada = res.data[0];
          this.mostrarPanelPersona.set(true);
          this.mostrarResultadosMultiples.set(false);
          this.busquedaTexto = this.nuevaPersona.strCedula.trim();
        }
      },
      error: (err) => {
        this.savingNuevaPersona.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo registrar a la persona y activar el carnet.',
        });
      },
    });
  }

  // Cambiar estado Activo / Desactivado con Auditoría
  cambiarEstado(carnet: any) {
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
        if (this.mostrarPanelPersona()) {
          this.consultarPorCedula(this.personaEncontrada?.strCedula || carnet?.strCedula);
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
        if (this.mostrarPanelPersona()) {
          this.consultarPorCedula(this.personaEncontrada?.strCedula || this.carnetSeleccionado?.strCedula);
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

        // Refrescar datos en el panel
        if (this.mostrarPanelPersona()) {
          this.consultarPorCedula(this.personaEncontrada?.strCedula);
        }
        this.cargarEstadisticas();
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
