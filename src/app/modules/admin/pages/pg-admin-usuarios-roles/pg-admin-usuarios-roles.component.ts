// cspell:disable
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// PrimeNG Modules
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { Select } from 'primeng/select';
import { MultiSelect } from 'primeng/multiselect';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { CheckboxModule } from 'primeng/checkbox';

// Services
import {
  AdminSeguridadService,
  IPersonaAdmin,
  IRolAdmin,
  IPadreOpcion,
  IOpcion,
  IRolOpcion,
} from '../../../../services/admin/AdminSeguridad.service';
import { SwCasService } from '../../../../utils/cas/sw-cas.service';

export interface IOpcionMenuMatriz {
  intIdOpcion: number;
  strNombre: string;
  strDescripcion?: string;
  strUrl?: string;
  strIcono?: string;
  intOrden: number;
  intPadreOpcion: number;
  strPadreNombre: string;
  strPadreIcono?: string;
  activo: boolean;
  bitInsertar: boolean;
  bitModificar: boolean;
  bitEliminar: boolean;
}

export interface IGrupoModulo {
  intPadreOpcion: number;
  strNombre: string;
  strIcono?: string;
  intOrden: number;
  opciones: IOpcionMenuMatriz[];
  todosActivos: boolean;
}

@Component({
  selector: 'app-pg-admin-usuarios-roles',
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    Select,
    MultiSelect,
    DialogModule,
    ToastModule,
    TagModule,
    TooltipModule,
    IconFieldModule,
    InputIconModule,
    ToggleSwitch,
    CheckboxModule,
  ],
  providers: [MessageService],
  templateUrl: './pg-admin-usuarios-roles.component.html',
  styleUrl: './pg-admin-usuarios-roles.component.css',
})
export default class PgAdminUsuariosRolesComponent implements OnInit {
  private seguridadService = inject(AdminSeguridadService);
  private messageService = inject(MessageService);
  private swCas = inject(SwCasService);

  // Control de Pestañas Activas
  tabActiva = signal<'personas' | 'permisos' | 'roles' | 'opciones'>('permisos');

  // Estados de Carga
  loadingPersonas = signal<boolean>(false);
  loadingRoles = signal<boolean>(false);
  loadingPermisos = signal<boolean>(false);
  loadingOpciones = signal<boolean>(false);
  saving = signal<boolean>(false);
  searchingCentralizada = signal<boolean>(false);

  // ==========================================
  // TAB 1: PERSONAS Y ASIGNACIÓN DE ROLES
  // ==========================================
  personas = signal<IPersonaAdmin[]>([]);
  filtroBusquedaPersona: string = '';
  filtroRolPersona: any = 'todos';
  filtroEstadoPersona: any = 'todos';

  // Modal Agregar / Editar Persona y Roles
  dialogPersona = signal<boolean>(false);
  modoPersona: 'crear' | 'editar' = 'crear';
  personaSeleccionada: any = null;

  // Formulario Persona
  cedulaForm: string = '';
  nombresForm: string = '';
  apellidosForm: string = '';
  correoForm: string = '';
  telefonoForm: string = '';
  dependenciaForm: string = 'ESPOCH';
  cargoForm: string = '';
  rolesSeleccionadosForm: number[] = [];
  estadoPersonaForm: boolean = true;
  personaCentralizadaPreview: any = null;

  // Opciones para filtros y dropdowns
  rolesOptions = signal<{ label: string; value: number; icono?: string; desc?: string }[]>([]);
  rolesFiltroOptions = signal<{ label: string; value: any }[]>([
    { label: 'Todos los roles', value: 'todos' },
  ]);

  estadosOptions = [
    { label: 'Todos los estados', value: 'todos' },
    { label: 'Activos', value: 1 },
    { label: 'Inactivos', value: 0 },
  ];

  // ==========================================
  // TAB 2: ROLES INSTITUCIONALES
  // ==========================================
  rolesList = signal<IRolAdmin[]>([]);
  filtroBusquedaRol: string = '';
  dialogRol = signal<boolean>(false);
  modoRol: 'crear' | 'editar' = 'crear';
  rolSeleccionado: any = null;

  // Formulario Rol
  rolNombreForm: string = '';
  rolDescripcionForm: string = '';
  rolIconoForm: string = 'pi pi-user';
  rolEstadoForm: boolean = true;

  // ==========================================
  // TAB 3: MENÚS Y PERMISOS POR ROL (VISUAL BUILDER)
  // ==========================================
  rolSeleccionadoPermisos = signal<number>(1);
  opcionesMatriz = signal<IOpcionMenuMatriz[]>([]);
  guardandoPermisos = signal<boolean>(false);
  cambiosPendientes = signal<boolean>(false);
  rolParaClonar: number | null = null;
  dialogClonar = signal<boolean>(false);

  // Rol actualmente seleccionado objeto
  rolActual = computed(() => {
    const id = this.rolSeleccionadoPermisos();
    return this.rolesList().find((r) => r.intIdRol === id) || null;
  });

  // Módulos agrupados por menú padre para edición visual
  modulosAgrupados = computed<IGrupoModulo[]>(() => {
    const matriz = this.opcionesMatriz();
    const padresMap = new Map<number, IPadreOpcion>();
    this.opcionesPadreList().forEach((p) => padresMap.set(p.intPadreOpcion, p));

    const gruposMap = new Map<number, IGrupoModulo>();

    for (const item of matriz) {
      if (!gruposMap.has(item.intPadreOpcion)) {
        const padre = padresMap.get(item.intPadreOpcion);
        gruposMap.set(item.intPadreOpcion, {
          intPadreOpcion: item.intPadreOpcion,
          strNombre: item.strPadreNombre || padre?.strNombre || 'Módulo Principal',
          strIcono: item.strPadreIcono || padre?.strIcono || 'pi pi-folder',
          intOrden: padre?.intOrden || item.intPadreOpcion || 1,
          opciones: [],
          todosActivos: false,
        });
      }
      gruposMap.get(item.intPadreOpcion)!.opciones.push(item);
    }

    const grupos = Array.from(gruposMap.values());
    grupos.forEach((g) => {
      // Ordenar opciones dentro del módulo por intOrden ascendente
      g.opciones.sort((a, b) => (a.intOrden || 0) - (b.intOrden || 0));
      g.todosActivos = g.opciones.length > 0 && g.opciones.every((o) => o.activo);
    });

    // Ordenar los módulos por intOrden ascendente
    grupos.sort((a, b) => (a.intOrden || 0) - (b.intOrden || 0));
    return grupos;
  });

  // PREVISUALIZACIÓN EN VIVO (Mockup Sidebar reactivo en 0ms ordenado)
  menuPreviewLive = computed(() => {
    const grupos = this.modulosAgrupados();
    return grupos
      .map((g) => ({
        strPadre: g.strNombre,
        strIconoPadre: g.strIcono,
        intPadreOpcion: g.intPadreOpcion,
        intOrden: g.intOrden,
        hijos: g.opciones
          .filter((o) => o.activo)
          .map((o) => ({
            strOpcion: o.strNombre,
            strIconoOpcion: o.strIcono || 'pi pi-file',
            strUrlOpcion: o.strUrl,
            intOrden: o.intOrden,
            bitInsertar: o.bitInsertar,
            bitModificar: o.bitModificar,
            bitEliminar: o.bitEliminar,
          }))
          .sort((a, b) => (a.intOrden || 0) - (b.intOrden || 0)),
      }))
      .filter((g) => g.hijos.length > 0)
      .sort((a, b) => (a.intOrden || 0) - (b.intOrden || 0));
  });

  totalOpcionesHabilitadas = computed(() => {
    return this.opcionesMatriz().filter((o) => o.activo).length;
  });

  // Listados Maestros del Catálogo
  opcionesPadreList = signal<IPadreOpcion[]>([]);
  opcionesHijasList = signal<IOpcion[]>([]);
  filtroBusquedaCatalogo: string = '';
  filtroBusquedaPadres: string = '';
  filtroBusquedaHijas: string = '';

  // Control de carpetas y opciones añadidas al rol dinámicamente
  padresAgregadosAlRol = signal<Set<number>>(new Set<number>());
  dialogSeleccionarOpcionCatalogo = signal<boolean>(false);
  dialogSeleccionarPadreCatalogo = signal<boolean>(false);
  carpetaDestinoParaAgregarOpcion: number | null = null;
  filtroBusquedaCatalogoOpciones = '';
  filtroBusquedaCatalogoPadres = '';

  // Menús Padres filtrados para el catálogo (Tab 4)
  padresCatalogoFiltrados = computed(() => {
    const query = this.filtroBusquedaPadres.trim().toLowerCase();
    const padres = this.opcionesPadreList();
    const matriz = this.opcionesMatriz();

    return padres
      .map((p) => {
        const totalHijas = matriz.filter((m) => m.intPadreOpcion === p.intPadreOpcion).length;
        return {
          ...p,
          totalHijas,
        };
      })
      .filter((p) => {
        if (!query) return true;
        return (
          p.strNombre.toLowerCase().includes(query) ||
          (p.strUrl || '').toLowerCase().includes(query)
        );
      })
      .sort((a, b) => (a.intOrden || 0) - (b.intOrden || 0));
  });

  // Rutas Hijas filtradas para el catálogo (Tab 4)
  hijasCatalogoFiltradas = computed(() => {
    const query = this.filtroBusquedaHijas.trim().toLowerCase();
    const hijas = this.opcionesHijasList();
    const padres = this.opcionesPadreList();
    const matriz = this.opcionesMatriz();

    const padresMap = new Map<number, IPadreOpcion>();
    padres.forEach((p) => padresMap.set(p.intPadreOpcion, p));

    const opcionPadreMap = new Map<number, number>();
    matriz.forEach((m) => opcionPadreMap.set(m.intIdOpcion, m.intPadreOpcion));

    return hijas
      .map((h) => {
        const pId = opcionPadreMap.get(h.intIdOpcion) || 1;
        const padre = padresMap.get(pId);
        return {
          ...h,
          intPadreOpcion: pId,
          strPadreNombre: padre?.strNombre || 'Módulo Base',
          strPadreIcono: padre?.strIcono || 'pi pi-folder',
        };
      })
      .filter((h) => {
        if (!query) return true;
        return (
          h.strNombre.toLowerCase().includes(query) ||
          (h.strUrl || '').toLowerCase().includes(query) ||
          (h.strPadreNombre || '').toLowerCase().includes(query) ||
          (h.strDescripcion || '').toLowerCase().includes(query)
        );
      })
      .sort((a, b) => (a.intOrden || 0) - (b.intOrden || 0));
  });

  // Carpetas organizadas del Rol con Drag & Drop
  carpetasDelRol = computed(() => {
    const matriz = this.opcionesMatriz();
    const padres = this.opcionesPadreList();
    const padresMap = new Map<number, IPadreOpcion>();
    padres.forEach((p) => padresMap.set(p.intPadreOpcion, p));

    const gruposMap = new Map<number, {
      intPadreOpcion: number;
      strNombre: string;
      strIcono?: string;
      strUrl?: string;
      intOrden: number;
      opciones: IOpcionMenuMatriz[];
      totalActivas: number;
    }>();

    // 1. Agregar carpetas explícitamente añadidas al rol
    for (const pId of this.padresAgregadosAlRol()) {
      const p = padresMap.get(pId);
      if (p) {
        gruposMap.set(pId, {
          intPadreOpcion: p.intPadreOpcion,
          strNombre: p.strNombre,
          strIcono: p.strIcono || 'pi pi-folder',
          strUrl: p.strUrl || '/dashboard',
          intOrden: p.intOrden || p.intPadreOpcion || 1,
          opciones: [],
          totalActivas: 0,
        });
      }
    }

    // 2. Agregar carpetas que tienen opciones en la matriz
    for (const item of matriz) {
      if (!gruposMap.has(item.intPadreOpcion)) {
        const padre = padresMap.get(item.intPadreOpcion);
        gruposMap.set(item.intPadreOpcion, {
          intPadreOpcion: item.intPadreOpcion,
          strNombre: item.strPadreNombre || padre?.strNombre || 'Módulo Principal',
          strIcono: item.strPadreIcono || padre?.strIcono || 'pi pi-folder',
          strUrl: padre?.strUrl || '/dashboard',
          intOrden: padre?.intOrden || item.intPadreOpcion || 1,
          opciones: [],
          totalActivas: 0,
        });
      }
      gruposMap.get(item.intPadreOpcion)!.opciones.push(item);
      if (item.activo) {
        gruposMap.get(item.intPadreOpcion)!.totalActivas++;
      }
    }

    const grupos = Array.from(gruposMap.values());
    grupos.forEach((g) => {
      g.opciones.sort((a, b) => (a.intOrden || 0) - (b.intOrden || 0));
    });

    grupos.sort((a, b) => (a.intOrden || 0) - (b.intOrden || 0));
    return grupos;
  });

  // Opciones disponibles para agregar desde el catálogo
  opcionesDisponiblesParaCatalogo = computed(() => {
    const hijas = this.opcionesHijasList();
    const query = this.filtroBusquedaCatalogoOpciones.trim().toLowerCase();
    return hijas.filter((h) => {
      if (!query) return true;
      return (
        h.strNombre.toLowerCase().includes(query) ||
        (h.strDescripcion || '').toLowerCase().includes(query) ||
        (h.strUrl || '').toLowerCase().includes(query)
      );
    });
  });

  // Padres disponibles para agregar desde el catálogo
  padresDisponiblesParaCatalogo = computed(() => {
    const padres = this.opcionesPadreList();
    const query = this.filtroBusquedaCatalogoPadres.trim().toLowerCase();
    return padres.filter((p) => {
      if (!query) return true;
      return (
        p.strNombre.toLowerCase().includes(query) ||
        (p.strUrl || '').toLowerCase().includes(query)
      );
    });
  });

  // Elemento seleccionado en el Árbol para el Panel de Detalle
  elementoSeleccionado = signal<{
    tipo: 'padre' | 'hija' | 'nuevo_padre' | 'nueva_hija';
    id: number | null;
    data: any;
  } | null>(null);

  // Control de Diálogo de Confirmación de Eliminación
  dialogConfirmacionEliminar = signal<boolean>(false);
  itemAEliminar = signal<{
    tipo: 'padre' | 'hija';
    id: number;
    nombre: string;
    totalHijas?: number;
  } | null>(null);
  eliminando = signal<boolean>(false);

  carpetasColapsadas = signal<Set<number>>(new Set<number>());
  itemArrastrado = signal<IOpcion | IOpcionMenuMatriz | any | null>(null);
  carpetaDestinoHover = signal<number | null>(null);

  opcionesPadreOptions = computed(() => {
    return this.opcionesPadreList().map((p) => ({
      label: p.strNombre,
      value: p.intPadreOpcion,
      icono: p.strIcono,
    }));
  });

  // Catálogo jerárquico que une visualmente cada menú padre con sus opciones hijas
  catalogoPadresConHijos = computed(() => {
    const padres = this.opcionesPadreList();
    const hijas = this.opcionesHijasList();
    const matriz = this.opcionesMatriz();
    const query = this.filtroBusquedaCatalogo.trim().toLowerCase();

    // Mapear cada opción con el ID de su padre
    const opcionPadreMap = new Map<number, number>();
    matriz.forEach((m) => opcionPadreMap.set(m.intIdOpcion, m.intPadreOpcion));

    return padres.map((p) => {
      let hijasDePadre = hijas.filter((h) => {
        const padreId = opcionPadreMap.get(h.intIdOpcion) || 1;
        return padreId === p.intPadreOpcion;
      });

      if (query) {
        const padreCoincide =
          p.strNombre.toLowerCase().includes(query) ||
          (p.strUrl || '').toLowerCase().includes(query);

        if (!padreCoincide) {
          hijasDePadre = hijasDePadre.filter(
            (h) =>
              h.strNombre.toLowerCase().includes(query) ||
              (h.strDescripcion || '').toLowerCase().includes(query) ||
              (h.strUrl || '').toLowerCase().includes(query)
          );
        }
      }

      return {
        ...p,
        hijas: hijasDePadre.sort((a, b) => (a.intOrden || 0) - (b.intOrden || 0)),
      };
    }).filter((p) => {
      if (!query) return true;
      const padreCoincide =
        p.strNombre.toLowerCase().includes(query) ||
        (p.strUrl || '').toLowerCase().includes(query);
      return padreCoincide || p.hijas.length > 0;
    }).sort((a, b) => (a.intOrden || 0) - (b.intOrden || 0));
  });

  // Opciones huérfanas si existieran
  catalogoHijasSinPadre = computed(() => {
    const padresIds = new Set(this.opcionesPadreList().map((p) => p.intPadreOpcion));
    const hijas = this.opcionesHijasList();
    const matriz = this.opcionesMatriz();
    const query = this.filtroBusquedaCatalogo.trim().toLowerCase();
    const opcionPadreMap = new Map<number, number>();
    matriz.forEach((m) => opcionPadreMap.set(m.intIdOpcion, m.intPadreOpcion));

    return hijas.filter((h) => {
      const padreId = opcionPadreMap.get(h.intIdOpcion);
      const huerfana = !padreId || !padresIds.has(padreId);
      if (!huerfana) return false;
      if (!query) return true;
      return (
        h.strNombre.toLowerCase().includes(query) ||
        (h.strDescripcion || '').toLowerCase().includes(query) ||
        (h.strUrl || '').toLowerCase().includes(query)
      );
    }).sort((a, b) => (a.intOrden || 0) - (b.intOrden || 0));
  });

  dialogPadre = signal<boolean>(false);
  modoPadre: 'crear' | 'editar' = 'crear';
  padreSeleccionado: any = null;
  padreNombreForm: string = '';
  padreIconoForm: string = 'pi pi-folder';
  padreOrdenForm: number = 1;
  padreUrlForm: string = '';
  padreEstadoForm: boolean = true;

  dialogHija = signal<boolean>(false);
  modoHija: 'crear' | 'editar' = 'crear';
  hijaSeleccionada: any = null;
  hijaNombreForm: string = '';
  hijaDescripcionForm: string = '';
  hijaUrlForm: string = '';
  hijaMetodoForm: string = 'GET';
  hijaIconoForm: string = 'pi pi-file';
  hijaOrdenForm: number = 1;
  hijaPadreForm: number = 1;
  hijaEstadoForm: boolean = true;

  cambiarPadreOpcion(opc: IOpcionMenuMatriz, nuevoPadreId: number) {
    const padre = this.opcionesPadreList().find((p) => p.intPadreOpcion === nuevoPadreId);
    opc.intPadreOpcion = nuevoPadreId;
    if (padre) {
      opc.strPadreNombre = padre.strNombre;
      opc.strPadreIcono = padre.strIcono;
    }
    this.opcionesMatriz.set([...this.opcionesMatriz()]);
    this.cambiosPendientes.set(true);
  }

  // KPIs Computados
  totalPersonas = computed(() => this.personas().length);
  totalPersonasConRol = computed(() => this.personas().filter((p) => p.rolesIds && p.rolesIds.length > 0).length);
  totalRolesCount = computed(() => this.rolesList().length);
  rolesActivosCount = computed(() => this.rolesList().filter((r) => r.intEstado === 1).length);

  ngOnInit() {
    this.cargarRoles();
    this.cargarPersonas();
    this.cargarOpcionesYPadres();
    this.cargarMatrizPermisosRol(this.rolSeleccionadoPermisos() || 1);
  }

  // ==========================================
  // MÉTODOS TAB 1: PERSONAS Y ASIGNACIÓN DE ROLES
  // ==========================================

  cargarPersonas() {
    this.loadingPersonas.set(true);
    this.seguridadService.getUsuarios().subscribe({
      next: (res) => {
        this.loadingPersonas.set(false);
        if (res && res.data) {
          this.personas.set(res.data);
        } else {
          this.personas.set([]);
        }
      },
      error: (err) => {
        this.loadingPersonas.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cargar el listado de personas y usuarios.',
        });
      },
    });
  }

  personasFiltradas = computed(() => {
    let list = this.personas();
    const query = this.filtroBusquedaPersona.trim().toLowerCase();

    if (query) {
      list = list.filter((p) => {
        const cedula = (p.strCedula || '').toLowerCase();
        const nombres = `${p.strNombres || ''} ${p.strApellidos || ''}`.toLowerCase();
        const correo = (p.strCorreo || '').toLowerCase();
        const dep = (p.strDepencia || '').toLowerCase();
        const cargo = (p.strCargo || '').toLowerCase();
        return (
          cedula.includes(query) ||
          nombres.includes(query) ||
          correo.includes(query) ||
          dep.includes(query) ||
          cargo.includes(query)
        );
      });
    }

    if (this.filtroRolPersona !== 'todos') {
      const rolId = Number(this.filtroRolPersona);
      list = list.filter((p) => p.rolesIds && p.rolesIds.includes(rolId));
    }

    if (this.filtroEstadoPersona !== 'todos') {
      const estado = Number(this.filtroEstadoPersona);
      list = list.filter((p) => p.intEstado === estado);
    }

    return list;
  });

  limpiarFiltrosPersonas() {
    this.filtroBusquedaPersona = '';
    this.filtroRolPersona = 'todos';
    this.filtroEstadoPersona = 'todos';
  }

  abrirModalNuevaPersona() {
    this.modoPersona = 'crear';
    this.personaSeleccionada = null;
    this.personaCentralizadaPreview = null;
    this.cedulaForm = '';
    this.nombresForm = '';
    this.apellidosForm = '';
    this.correoForm = '';
    this.telefonoForm = '';
    this.dependenciaForm = 'ESPOCH';
    this.cargoForm = '';
    this.rolesSeleccionadosForm = [];
    this.estadoPersonaForm = true;
    this.dialogPersona.set(true);
  }

  buscarPersonaPorCedula() {
    if (!this.cedulaForm || this.cedulaForm.trim().length < 8) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Cédula requerida',
        detail: 'Ingrese un número de cédula válido para consultar.',
      });
      return;
    }

    const cedulaLimpia = this.cedulaForm.trim().replace(/[\s-]/g, '');
    this.searchingCentralizada.set(true);

    // 1. Primero consultar si ya existe localmente
    this.seguridadService.consultarPersonaLocal(cedulaLimpia).subscribe({
      next: (resLocal) => {
        if (resLocal && resLocal.data && resLocal.data.length > 0) {
          const loc = resLocal.data[0];
          this.nombresForm = loc.strNombres || '';
          this.apellidosForm = loc.strApellidos || '';
          this.correoForm = loc.strCorreo || '';
          this.telefonoForm = loc.strTelefono || '';
          this.dependenciaForm = loc.strDepencia || 'ESPOCH';
          this.cargoForm = loc.strCargo || '';
          this.rolesSeleccionadosForm = loc.rolesIds || (loc.intIdRol ? [loc.intIdRol] : []);
          this.estadoPersonaForm = loc.intEstado !== 0;

          this.personaCentralizadaPreview = {
            origen: 'local',
            nombre: `${loc.strNombres} ${loc.strApellidos}`,
            rol: loc.rol || 'Sin Rol',
          };
          this.searchingCentralizada.set(false);
          this.messageService.add({
            severity: 'info',
            summary: 'Persona Registrada',
            detail: 'Los datos de la persona se cargaron desde la base de datos local.',
          });
          return;
        }

        // 2. Si no existe localmente, consultar en Centralizada DINARDAP
        this.seguridadService.obtenerPersonaCentralizada(cedulaLimpia).subscribe({
          next: (resCent) => {
            this.searchingCentralizada.set(false);
            if (resCent && (resCent.success || resCent.listado)) {
              const item = (resCent.listado && resCent.listado[0]) || resCent.data || resCent;
              this.nombresForm = item.perNombres || item.nombres || item.strNombres || '';
              this.apellidosForm = item.perPrimerApellido
                ? `${item.perPrimerApellido} ${item.perSegundoApellido || ''}`.trim()
                : item.apellidos || item.strApellidos || '';
              this.correoForm = item.perEmail || item.correo || item.strCorreo || '';
              this.telefonoForm = item.perCelular || item.telefono || item.strTelefono || '';

              this.personaCentralizadaPreview = {
                origen: 'centralizada',
                nombre: `${this.nombresForm} ${this.apellidosForm}`,
                correo: this.correoForm,
              };

              this.messageService.add({
                severity: 'success',
                summary: 'Encontrado en Centralizada',
                detail: 'Datos autocompletados desde el sistema institucional.',
              });
            } else {
              this.personaCentralizadaPreview = null;
              this.messageService.add({
                severity: 'warn',
                summary: 'No Encontrado en Centralizada',
                detail: 'No se encontró registro en Centralizada. Ingrese los datos manualmente.',
              });
            }
          },
          error: () => {
            this.searchingCentralizada.set(false);
            this.messageService.add({
              severity: 'info',
              summary: 'Registro Manual',
              detail: 'Complete los datos de la persona manualmente.',
            });
          },
        });
      },
      error: () => {
        this.searchingCentralizada.set(false);
      },
    });
  }

  abrirModalEditarPersona(persona: IPersonaAdmin) {
    this.modoPersona = 'editar';
    this.personaSeleccionada = persona;
    this.personaCentralizadaPreview = null;
    this.cedulaForm = persona.strCedula;
    this.nombresForm = persona.strNombres;
    this.apellidosForm = persona.strApellidos;
    this.correoForm = persona.strCorreo || '';
    this.telefonoForm = persona.strTelefono || '';
    this.dependenciaForm = persona.strDepencia || 'ESPOCH';
    this.cargoForm = persona.strCargo || '';
    this.rolesSeleccionadosForm = persona.rolesIds ? [...persona.rolesIds] : [];
    this.estadoPersonaForm = persona.intEstado === 1;
    this.dialogPersona.set(true);
  }

  guardarPersona() {
    if (!this.cedulaForm || this.cedulaForm.trim() === '') {
      this.messageService.add({ severity: 'warn', summary: 'Cédula requerida', detail: 'Ingrese la cédula de la persona.' });
      return;
    }
    if (!this.nombresForm || this.nombresForm.trim() === '' || !this.apellidosForm || this.apellidosForm.trim() === '') {
      this.messageService.add({ severity: 'warn', summary: 'Nombres requeridos', detail: 'Complete los nombres y apellidos.' });
      return;
    }

    this.saving.set(true);
    const adminInfo = this.swCas.getUserInfo();

    const payload = {
      intIdPersona: this.personaSeleccionada?.intIdPersona,
      strCedula: this.cedulaForm.trim().replace(/[\s-]/g, ''),
      strNombres: this.nombresForm.trim().toUpperCase(),
      strApellidos: this.apellidosForm.trim().toUpperCase(),
      strCorreo: this.correoForm.trim().toLowerCase(),
      strTelefono: this.telefonoForm.trim(),
      intEstado: this.estadoPersonaForm ? 1 : 0,
      roles: this.rolesSeleccionadosForm,
      strDepencia: this.dependenciaForm.trim() || 'ESPOCH',
      strCargo: this.cargoForm.trim() || '',
      adminInfo: adminInfo,
    };

    this.seguridadService.crearOActualizarPersona(payload).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.dialogPersona.set(false);
        this.messageService.add({
          severity: 'success',
          summary: this.modoPersona === 'crear' ? 'Persona Registrada' : 'Persona y Roles Actualizados',
          detail: 'Los datos y roles asignados se guardaron correctamente.',
        });
        this.cargarPersonas();
      },
      error: (err) => {
        this.saving.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo guardar la persona o sus roles.',
        });
      },
    });
  }

  // ==========================================
  // MÉTODOS TAB 2: ROLES INSTITUCIONALES
  // ==========================================

  cargarRoles() {
    this.loadingRoles.set(true);
    this.seguridadService.getTodosRoles().subscribe({
      next: (res) => {
        this.loadingRoles.set(false);
        if (res && res.data) {
          this.rolesList.set(res.data);
          const options = res.data.map((r) => ({ label: r.strNombre, value: r.intIdRol }));
          this.rolesOptions.set(options);
          this.rolesFiltroOptions.set([{ label: 'Todos los roles', value: 'todos' }, ...options]);

          // Si aún no se han cargado las opciones de la matriz, cargarlas con el rol seleccionado
          if (this.opcionesMatriz().length === 0) {
            const rolActivo = this.rolSeleccionadoPermisos() || (options.length > 0 ? options[0].value : 1);
            this.seleccionarRolParaPermisos(rolActivo);
          }
        }
      },
      error: () => {
        this.loadingRoles.set(false);
      },
    });
  }

  rolesFiltrados = computed(() => {
    let list = this.rolesList();
    const query = this.filtroBusquedaRol.trim().toLowerCase();
    if (query) {
      list = list.filter(
        (r) =>
          r.strNombre.toLowerCase().includes(query) ||
          (r.strDescripcion || '').toLowerCase().includes(query)
      );
    }
    return list;
  });

  abrirModalNuevoRol() {
    this.modoRol = 'crear';
    this.rolSeleccionado = null;
    this.rolNombreForm = '';
    this.rolDescripcionForm = '';
    this.rolIconoForm = 'pi pi-user';
    this.rolEstadoForm = true;
    this.dialogRol.set(true);
  }

  abrirModalEditarRol(rol: IRolAdmin) {
    this.modoRol = 'editar';
    this.rolSeleccionado = rol;
    this.rolNombreForm = rol.strNombre;
    this.rolDescripcionForm = rol.strDescripcion || '';
    this.rolIconoForm = rol.strIcono || 'pi pi-user';
    this.rolEstadoForm = rol.intEstado === 1;
    this.dialogRol.set(true);
  }

  guardarRol() {
    if (!this.rolNombreForm || this.rolNombreForm.trim() === '') {
      this.messageService.add({ severity: 'warn', summary: 'Nombre requerido', detail: 'Ingrese el nombre del rol.' });
      return;
    }

    this.saving.set(true);
    const body = {
      intIdRol: this.rolSeleccionado?.intIdRol,
      strNombre: this.rolNombreForm.trim().toUpperCase(),
      strDescripcion: this.rolDescripcionForm.trim(),
      strIcono: this.rolIconoForm.trim() || 'pi pi-user',
      intEstado: this.rolEstadoForm ? 1 : 0,
    };

    const request$ =
      this.modoRol === 'crear'
        ? this.seguridadService.crearRol(body)
        : this.seguridadService.actualizarRol(body);

    request$.subscribe({
      next: (res: any) => {
        this.saving.set(false);
        if (res && res.count === -1) {
          this.messageService.add({
            severity: 'error',
            summary: 'Atención',
            detail: res.message || 'No se pudo procesar el rol.',
          });
          return;
        }
        this.dialogRol.set(false);
        this.messageService.add({
          severity: 'success',
          summary: this.modoRol === 'crear' ? 'Rol Creado' : 'Rol Actualizado',
          detail: `El rol "${body.strNombre}" se guardó exitosamente.`,
        });
        this.cargarRoles();
      },
      error: (err: any) => {
        this.saving.set(false);
        const errMsg = err?.error?.message || err?.error || err?.message || 'No se pudo guardar el rol.';
        this.messageService.add({ severity: 'error', summary: 'Error', detail: typeof errMsg === 'string' ? errMsg : 'No se pudo guardar el rol.' });
      },
    });
  }

  // ==========================================
  // MÉTODOS TAB 3: MENÚS Y PERMISOS POR ROL
  // ==========================================

  seleccionarRolParaPermisos(idRol: number) {
    this.rolSeleccionadoPermisos.set(idRol);
    this.cargarMatrizPermisosRol(idRol);
  }

  normalizarTexto(txt?: string): string {
    return (txt || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  normalizarIcono(icono?: string, url?: string, nombre?: string): string {
    const raw = (icono || '').trim();
    if (raw.startsWith('pi pi-') && raw !== 'pi pi-file') {
      return raw;
    }
    const u = this.normalizarTexto(url);
    const n = this.normalizarTexto(nombre);

    // 1. Logs de Auditoría y Control Administrativo
    if (
      u.includes('auditoria') ||
      u.includes('log') ||
      n.includes('auditoria') ||
      n.includes('log') ||
      n.includes('control administrativo')
    ) {
      return 'pi pi-shield-check';
    }

    // 2. Gestión de Seguridad: Usuarios, Roles y Menús
    if (
      u.includes('usuarios-roles') ||
      n.includes('usuarios, roles') ||
      n.includes('usuarios y roles') ||
      n.includes('seguridad: usuarios') ||
      n.includes('roles y menus') ||
      (n.includes('seguridad') && (n.includes('usuario') || n.includes('rol') || n.includes('menu'))) ||
      (n.includes('usuarios') && n.includes('roles'))
    ) {
      return 'pi pi-users-cog';
    }

    // 3. Seguridad General / Guardias / Vigilancia
    if (
      n === 'seguridad' ||
      u.includes('guardia') ||
      n.includes('guardia') ||
      n.includes('vigilan') ||
      (n.includes('seguridad') && !n.includes('usuario'))
    ) {
      return 'pi pi-shield';
    }

    // 4. Carnets y Credenciales
    if (u.includes('carnet') || n.includes('carnet') || n.includes('credencial')) {
      return 'pi pi-id-card';
    }

    // 5. Lector QR / Códigos QR / Escaneo
    if (u.includes('/qr') || u.includes('lector') || n.includes('qr') || n.includes('lector') || n.includes('escan')) {
      return 'pi pi-qrcode';
    }

    // 6. Validación de QR
    if (u.includes('validar') || n.includes('validar') || n.includes('verific')) {
      return 'pi pi-check-circle';
    }

    // 7. Invitados y Proveedores
    if (u.includes('invitado') || n.includes('invitado') || n.includes('proveedor') || n.includes('visita')) {
      return 'pi pi-users';
    }

    // 8. Historial de Entradas y Accesos
    if (u.includes('historial') || u.includes('acceso') || n.includes('historial') || n.includes('acceso') || n.includes('entrada') || n.includes('salida')) {
      return 'pi pi-calendar-clock';
    }

    // 9. Historial de Cambios / Changelog
    if (u.includes('changelog') || u.includes('cambio') || n.includes('cambio') || n.includes('changelog') || n.includes('actualiza') || n.includes('novedad')) {
      return 'pi pi-history';
    }

    // 10. Configuración
    if (u.includes('config') || n.includes('config') || n.includes('ajuste') || n.includes('administracion')) {
      return 'pi pi-cog';
    }

    // 11. Términos y Políticas
    if (u.includes('termino') || n.includes('termino') || n.includes('politica')) {
      return 'pi pi-file-edit';
    }

    // 12. Reportes y Estadísticas
    if (u.includes('reporte') || n.includes('reporte') || n.includes('estadistica') || n.includes('informe')) {
      return 'pi pi-chart-bar';
    }

    // 13. Enrolamiento
    if (u.includes('enrola') || n.includes('enrola') || n.includes('registro')) {
      return 'pi pi-user-plus';
    }

    // 14. Usuarios y Roles individuales
    if (u.includes('usuario') || n.includes('usuario') || u.includes('rol') || n.includes('rol')) {
      return 'pi pi-users-cog';
    }

    // 15. Mi Carnet / Perfil
    if (u.includes('/users') || n.includes('perfil') || n.includes('mi carnet')) {
      return 'pi pi-user';
    }

    if (raw) {
      const rawLower = raw.toLowerCase();
      if (rawLower.includes('id-card') || rawLower.includes('address-card')) return 'pi pi-id-card';
      if (rawLower.includes('qrcode') || rawLower.includes('barcode')) return 'pi pi-qrcode';
      if (rawLower.includes('users') || rawLower.includes('user-friends')) return 'pi pi-users';
      if (rawLower.includes('user')) return 'pi pi-user';
      if (rawLower.includes('shield-check')) return 'pi pi-shield-check';
      if (rawLower.includes('shield')) return 'pi pi-shield';
      if (rawLower.includes('cog') || rawLower.includes('gear')) return 'pi pi-cog';
      if (rawLower.includes('history') || rawLower.includes('clock')) return 'pi pi-history';
      if (rawLower.includes('check')) return 'pi pi-check-circle';
      if (rawLower.includes('chart')) return 'pi pi-chart-bar';
      return raw.startsWith('pi ') ? raw : `pi ${raw}`;
    }

    return 'pi pi-file';
  }

  cargarMatrizPermisosRol(idRol: number) {
    this.loadingPermisos.set(true);

    // Obtener todas las opciones disponibles y las asignadas a este rol
    this.seguridadService.getOpcionesHijas(2).subscribe({
      next: (resOpciones) => {
        const todasOpciones = (resOpciones.data || []).map((o: IOpcion) => ({
          ...o,
          strIcono: this.normalizarIcono(o.strIcono, o.strUrl, o.strNombre),
        }));

        this.seguridadService.getOpcionesPadre(2).subscribe({
          next: (resPadres) => {
            const padresData = (resPadres.data || []).map((p: IPadreOpcion) => ({
              ...p,
              strIcono: this.normalizarIcono(p.strIcono, p.strUrl, p.strNombre),
            }));
            if (this.opcionesPadreList().length === 0) {
              this.opcionesPadreList.set(padresData);
            }
            const padresMap = new Map<number, IPadreOpcion>();
            padresData.forEach((p: IPadreOpcion) => padresMap.set(p.intPadreOpcion, p));

            this.seguridadService.getRolOpciones(2, idRol).subscribe({
              next: (resRolOpc) => {
                const asignadas = resRolOpc.data || [];
                const asignadasMap = new Map<number, IRolOpcion>();
                asignadas.forEach((ro) => asignadasMap.set(ro.intOpcion, ro));

                const matriz: IOpcionMenuMatriz[] = todasOpciones.map((opc: IOpcion) => {
                  const asignada = asignadasMap.get(opc.intIdOpcion);
                  const padre = padresMap.get(asignada?.intPadreOpcion || opc.intOrden || 1);
                  const iconoOpcion = this.normalizarIcono(opc.strIcono, opc.strUrl, opc.strNombre);
                  const iconoPadre = this.normalizarIcono(asignada?.strIconoPadre || padre?.strIcono, padre?.strUrl, padre?.strNombre);

                  return {
                    intIdOpcion: opc.intIdOpcion,
                    strNombre: opc.strNombre,
                    strDescripcion: opc.strDescripcion,
                    strUrl: opc.strUrl,
                    strIcono: iconoOpcion,
                    intOrden: opc.intOrden || 1,
                    intPadreOpcion: asignada?.intPadreOpcion || 1,
                    strPadreNombre: asignada?.strPadre || padre?.strNombre || 'General',
                    strPadreIcono: iconoPadre || 'pi pi-folder',
                    activo: !!asignada,
                    bitInsertar: asignada ? !!asignada.bitInsertar : true,
                    bitModificar: asignada ? !!asignada.bitModificar : true,
                    bitEliminar: asignada ? !!asignada.bitEliminar : true,
                  };
                });

                // Ordenar por menú padre y orden
                matriz.sort((a, b) => a.intPadreOpcion - b.intPadreOpcion || a.intOrden - b.intOrden);

                this.opcionesMatriz.set(matriz);
                this.loadingPermisos.set(false);
              },
              error: () => {
                this.loadingPermisos.set(false);
              },
            });
          },
          error: () => {
            this.loadingPermisos.set(false);
          },
        });
      },
      error: () => {
        this.loadingPermisos.set(false);
      },
    });
  }

  marcarTodasOpciones(marcar: boolean) {
    const actualizada = this.opcionesMatriz().map((item) => ({
      ...item,
      activo: marcar,
      bitInsertar: marcar,
      bitModificar: marcar,
      bitEliminar: marcar,
    }));
    this.opcionesMatriz.set(actualizada);
    this.cambiosPendientes.set(true);
  }

  toggleGrupo(grupo: IGrupoModulo) {
    const nuevoEstado = !grupo.todosActivos;
    const idsHijas = new Set(grupo.opciones.map((o) => o.intIdOpcion));
    const actualizada = this.opcionesMatriz().map((item) => {
      if (idsHijas.has(item.intIdOpcion)) {
        return {
          ...item,
          activo: nuevoEstado,
          bitInsertar: nuevoEstado,
          bitModificar: nuevoEstado,
          bitEliminar: nuevoEstado,
        };
      }
      return item;
    });
    this.opcionesMatriz.set(actualizada);
    this.cambiosPendientes.set(true);
  }

  toggleOpcion(opc: IOpcionMenuMatriz) {
    opc.activo = !opc.activo;
    if (opc.activo) {
      opc.bitInsertar = true;
      opc.bitModificar = true;
      opc.bitEliminar = true;
    }
    this.opcionesMatriz.set([...this.opcionesMatriz()]);
    this.cambiosPendientes.set(true);
  }

  abrirModalClonar() {
    this.rolParaClonar = null;
    this.dialogClonar.set(true);
  }

  clonarPermisosDesdeRol() {
    if (!this.rolParaClonar) {
      this.messageService.add({ severity: 'warn', summary: 'Rol requerido', detail: 'Seleccione un rol de origen para clonar.' });
      return;
    }

    this.loadingPermisos.set(true);
    this.seguridadService.getRolOpciones(2, this.rolParaClonar).subscribe({
      next: (res) => {
        this.loadingPermisos.set(false);
        this.dialogClonar.set(false);
        const asignadas = res.data || [];
        const asignadasMap = new Map<number, IRolOpcion>();
        asignadas.forEach((ro) => asignadasMap.set(ro.intOpcion, ro));

        const actualizada = this.opcionesMatriz().map((opc) => {
          const asig = asignadasMap.get(opc.intIdOpcion);
          const pId = asig?.intPadreOpcion ? asig.intPadreOpcion : opc.intPadreOpcion;
          const padre = this.opcionesPadreList().find((p) => p.intPadreOpcion === pId);
          return {
            ...opc,
            intPadreOpcion: pId,
            strPadreNombre: asig?.strPadre || padre?.strNombre || opc.strPadreNombre,
            strPadreIcono: asig?.strIconoPadre || padre?.strIcono || opc.strPadreIcono,
            activo: !!asig,
            bitInsertar: asig ? !!asig.bitInsertar : false,
            bitModificar: asig ? !!asig.bitModificar : false,
            bitEliminar: asig ? !!asig.bitEliminar : false,
          };
        });

        this.opcionesMatriz.set(actualizada);
        this.cambiosPendientes.set(true);
        this.messageService.add({
          severity: 'info',
          summary: 'Permisos Clonados en Previsualización',
          detail: 'Se cargaron los permisos del rol seleccionado. Revise la previsualización y guarde cuando esté listo.',
        });
      },
      error: () => {
        this.loadingPermisos.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo clonar el menú del rol.' });
      },
    });
  }

  guardarPermisosRol() {
    const rolId = this.rolSeleccionadoPermisos();
    if (!rolId) return;

    this.guardandoPermisos.set(true);

    const opcionesPayload = this.opcionesMatriz().map((opc) => ({
      intOpcion: opc.intIdOpcion,
      intPadreOpcion: opc.intPadreOpcion,
      bitInsertar: opc.bitInsertar ? 1 : 0,
      bitModificar: opc.bitModificar ? 1 : 0,
      bitEliminar: opc.bitEliminar ? 1 : 0,
      intEstado: opc.activo ? 1 : 0,
      activo: opc.activo,
    }));

    this.seguridadService.sincronizarRolOpciones(rolId, opcionesPayload).subscribe({
      next: () => {
        this.guardandoPermisos.set(false);
        this.cambiosPendientes.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Permisos de Menú Sincronizados',
          detail: 'Se guardaron las funcionalidades del menú asignadas a este rol.',
        });
      },
      error: () => {
        this.guardandoPermisos.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron sincronizar los permisos de menú del rol.',
        });
      },
    });
  }

  // ==========================================
  // MÉTODOS TAB 4: CATÁLOGO DE MENÚS Y OPCIONES
  // ==========================================

  cargarOpcionesYPadres() {
    this.loadingOpciones.set(true);
    this.seguridadService.getOpcionesPadre(2).subscribe({
      next: (resP) => {
        const padresNorm = (resP.data || []).map((p: IPadreOpcion) => ({
          ...p,
          strIcono: this.normalizarIcono(p.strIcono, p.strUrl, p.strNombre),
        }));
        this.opcionesPadreList.set(padresNorm);
        this.seguridadService.getOpcionesHijas(2).subscribe({
          next: (resH) => {
            const hijasNorm = (resH.data || []).map((h: IOpcion) => ({
              ...h,
              strIcono: this.normalizarIcono(h.strIcono, h.strUrl, h.strNombre),
            }));
            this.opcionesHijasList.set(hijasNorm);
            this.loadingOpciones.set(false);
          },
          error: () => this.loadingOpciones.set(false),
        });
      },
      error: () => this.loadingOpciones.set(false),
    });
  }

  abrirModalNuevoPadre() {
    this.modoPadre = 'crear';
    this.padreSeleccionado = null;
    this.padreNombreForm = '';
    this.padreIconoForm = 'pi pi-folder';
    this.padreOrdenForm = this.opcionesPadreList().length + 1;
    this.padreUrlForm = '';
    this.padreEstadoForm = true;
    this.dialogPadre.set(true);
  }

  abrirModalEditarPadre(padre: any) {
    this.modoPadre = 'editar';
    this.padreSeleccionado = padre;
    this.padreNombreForm = padre.strNombre;
    this.padreIconoForm = this.normalizarIcono(padre.strIcono, padre.strUrl, padre.strNombre) || 'pi pi-folder';
    this.padreOrdenForm = padre.intOrden || 1;
    this.padreUrlForm = padre.strUrl || '';
    this.padreEstadoForm = padre.intEstado !== undefined ? padre.intEstado === 1 : true;
    this.dialogPadre.set(true);
  }

  guardarPadre() {
    if (!this.padreNombreForm || this.padreNombreForm.trim() === '') {
      this.messageService.add({ severity: 'warn', summary: 'Nombre requerido', detail: 'Ingrese el nombre del menú padre.' });
      return;
    }

    this.saving.set(true);
    const body = {
      intPadreOpcion: this.padreSeleccionado?.intPadreOpcion,
      strNombre: this.padreNombreForm.trim(),
      strIcono: this.normalizarIcono(this.padreIconoForm.trim(), this.padreUrlForm, this.padreNombreForm) || 'pi pi-folder',
      intOrden: this.padreOrdenForm || 1,
      strUrl: this.padreUrlForm.trim() || '/dashboard',
      intEstado: this.padreEstadoForm ? 1 : 0,
    };

    const req$ =
      this.modoPadre === 'crear'
        ? this.seguridadService.crearOpcionPadre(body)
        : this.seguridadService.actualizarOpcionPadre(body);

    req$.subscribe({
      next: () => {
        this.saving.set(false);
        this.dialogPadre.set(false);
        this.messageService.add({
          severity: 'success',
          summary: this.modoPadre === 'crear' ? 'Menú Padre Creado' : 'Menú Padre Actualizado',
          detail: `El menú padre "${body.strNombre}" se guardó correctamente.`,
        });
        this.cargarOpcionesYPadres();
        this.cargarMatrizPermisosRol(this.rolSeleccionadoPermisos() || 1);
      },
      error: () => {
        this.saving.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar el menú padre.' });
      },
    });
  }

  abrirModalNuevaHija(padreId?: number) {
    this.modoHija = 'crear';
    this.hijaSeleccionada = null;
    this.hijaNombreForm = '';
    this.hijaDescripcionForm = '';
    this.hijaUrlForm = '';
    this.hijaMetodoForm = 'GET';
    this.hijaIconoForm = 'pi pi-file';
    this.hijaOrdenForm = this.opcionesHijasList().length + 1;
    this.hijaPadreForm = padreId || (this.opcionesPadreList().length > 0 ? this.opcionesPadreList()[0].intPadreOpcion : 1);
    this.hijaEstadoForm = true;
    this.dialogHija.set(true);
  }

  abrirModalEditarHija(hija: any, padreId?: number) {
    this.modoHija = 'editar';
    this.hijaSeleccionada = hija;
    this.hijaNombreForm = hija.strNombre;
    this.hijaDescripcionForm = hija.strDescripcion || '';
    this.hijaUrlForm = hija.strUrl || '';
    this.hijaMetodoForm = hija.strMetodo || 'GET';
    this.hijaIconoForm = this.normalizarIcono(hija.strIcono, hija.strUrl, hija.strNombre) || 'pi pi-file';
    this.hijaOrdenForm = hija.intOrden || 1;
    
    // Si viene padreId explícito usarlo, si no buscar en la matriz de permisos
    if (padreId) {
      this.hijaPadreForm = padreId;
    } else {
      const match = this.opcionesMatriz().find((m) => m.intIdOpcion === hija.intIdOpcion);
      this.hijaPadreForm = match ? match.intPadreOpcion : (this.opcionesPadreList().length > 0 ? this.opcionesPadreList()[0].intPadreOpcion : 1);
    }

    this.hijaEstadoForm = hija.intEstado !== undefined ? hija.intEstado === 1 : true;
    this.dialogHija.set(true);
  }

  guardarHija() {
    if (!this.hijaNombreForm || this.hijaNombreForm.trim() === '') {
      this.messageService.add({ severity: 'warn', summary: 'Nombre requerido', detail: 'Ingrese el nombre de la opción.' });
      return;
    }

    this.saving.set(true);
    const body = {
      intIdOpcion: this.hijaSeleccionada?.intIdOpcion,
      strNombre: this.hijaNombreForm.trim(),
      strDescripcion: this.hijaDescripcionForm.trim(),
      strUrl: this.hijaUrlForm.trim(),
      strMetodo: this.hijaMetodoForm.trim() || 'GET',
      strIcono: this.normalizarIcono(this.hijaIconoForm.trim(), this.hijaUrlForm, this.hijaNombreForm) || 'pi pi-file',
      intOrden: this.hijaOrdenForm || 1,
      intEstado: this.hijaEstadoForm ? 1 : 0,
    };

    const req$ =
      this.modoHija === 'crear'
        ? this.seguridadService.crearOpcionHija(body)
        : this.seguridadService.actualizarOpcionHija(body);

    req$.subscribe({
      next: () => {
        this.saving.set(false);
        this.dialogHija.set(false);

        // Si se seleccionó un padre específico para esta opción, actualizar la matriz de permisos
        if (body.intIdOpcion) {
          const opt = this.opcionesMatriz().find((o) => o.intIdOpcion === body.intIdOpcion);
          if (opt) {
            this.cambiarPadreOpcion(opt, this.hijaPadreForm);
          }
        }

        this.messageService.add({
          severity: 'success',
          summary: this.modoHija === 'crear' ? 'Opción Creada' : 'Opción Actualizada',
          detail: `La opción "${body.strNombre}" se guardó correctamente.`,
        });
        this.cargarOpcionesYPadres();
      },
      error: () => {
        this.saving.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar la opción.' });
      },
    });
  }

  // ==========================================
  // MÉTODOS DEL EXPLORADOR DE ÁRBOL Y DRAG & DROP
  // ==========================================

  autoSeleccionarPrimerElemento() {
    if (!this.elementoSeleccionado()) {
      if (this.opcionesPadreList().length > 0) {
        this.seleccionarPadreParaEditar(this.opcionesPadreList()[0]);
      }
    }
  }

  toggleColapsoCarpeta(padreId: number) {
    const s = new Set(this.carpetasColapsadas());
    if (s.has(padreId)) {
      s.delete(padreId);
    } else {
      s.add(padreId);
    }
    this.carpetasColapsadas.set(s);
  }

  seleccionarPadreParaEditar(padre: IPadreOpcion) {
    this.modoPadre = 'editar';
    this.padreSeleccionado = padre;
    this.padreNombreForm = padre.strNombre;
    this.padreIconoForm = this.normalizarIcono(padre.strIcono, padre.strUrl, padre.strNombre) || 'pi pi-folder';
    this.padreOrdenForm = padre.intOrden || 1;
    this.padreUrlForm = padre.strUrl || '/dashboard';
    this.padreEstadoForm = padre.intEstado === 1;
    this.elementoSeleccionado.set({ tipo: 'padre', id: padre.intPadreOpcion, data: padre });
  }

  seleccionarHijaParaEditar(hija: IOpcion, padreId?: number) {
    this.modoHija = 'editar';
    this.hijaSeleccionada = hija;
    this.hijaNombreForm = hija.strNombre;
    this.hijaDescripcionForm = hija.strDescripcion || '';
    this.hijaUrlForm = hija.strUrl || '';
    this.hijaMetodoForm = hija.strMetodo || 'GET';
    this.hijaIconoForm = this.normalizarIcono(hija.strIcono, hija.strUrl, hija.strNombre) || 'pi pi-file';
    this.hijaOrdenForm = hija.intOrden || 1;
    this.hijaEstadoForm = hija.intEstado === 1;

    let pId = padreId;
    if (!pId) {
      const match = this.opcionesMatriz().find((m) => m.intIdOpcion === hija.intIdOpcion);
      pId = match ? match.intPadreOpcion : (this.opcionesPadreList()[0]?.intPadreOpcion || 1);
    }
    this.hijaPadreForm = pId;
    this.elementoSeleccionado.set({ tipo: 'hija', id: hija.intIdOpcion, data: { ...hija, intPadreOpcion: pId } });
  }

  iniciarCrearNuevoPadre() {
    this.modoPadre = 'crear';
    this.padreSeleccionado = null;
    this.padreNombreForm = '';
    this.padreIconoForm = 'pi pi-folder';
    this.padreOrdenForm = this.opcionesPadreList().length + 1;
    this.padreUrlForm = '/dashboard';
    this.padreEstadoForm = true;
    this.elementoSeleccionado.set({ tipo: 'nuevo_padre', id: null, data: null });
  }

  iniciarCrearNuevaHija(padreId?: number) {
    this.modoHija = 'crear';
    this.hijaSeleccionada = null;
    this.hijaNombreForm = '';
    this.hijaDescripcionForm = '';
    this.hijaUrlForm = '';
    this.hijaMetodoForm = 'GET';
    this.hijaIconoForm = 'pi pi-file';
    this.hijaOrdenForm = this.opcionesHijasList().length + 1;
    this.hijaPadreForm = padreId || (this.opcionesPadreList()[0]?.intPadreOpcion || 1);
    this.hijaEstadoForm = true;
    this.elementoSeleccionado.set({ tipo: 'nueva_hija', id: null, data: null });
  }

  // Eventos de Arrastrar y Soltar (Drag & Drop)
  onDragStart(event: DragEvent, hija: any) {
    this.itemArrastrado.set(hija);
    if (event.dataTransfer) {
      event.dataTransfer.setData('text/plain', String(hija.intIdOpcion));
      event.dataTransfer.effectAllowed = 'move';
    }
  }

  onDragOverPadre(event: DragEvent, padre: any) {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
    this.carpetaDestinoHover.set(padre.intPadreOpcion);
  }

  onDragLeavePadre(event: DragEvent, padre: any) {
    if (this.carpetaDestinoHover() === padre.intPadreOpcion) {
      this.carpetaDestinoHover.set(null);
    }
  }

  onDropEnPadre(event: DragEvent, padreDestino: any) {
    event.preventDefault();
    this.carpetaDestinoHover.set(null);
    const hija = this.itemArrastrado();
    if (!hija || !padreDestino) return;

    // Buscar y actualizar en la matriz de permisos
    const opt = this.opcionesMatriz().find((o) => o.intIdOpcion === hija.intIdOpcion);
    if (opt) {
      this.cambiarPadreOpcion(opt, padreDestino.intPadreOpcion);
    }

    // Seleccionar la opción en el editor derecho
    this.seleccionarHijaParaEditar(hija, padreDestino.intPadreOpcion);

    this.messageService.add({
      severity: 'success',
      summary: 'Opción Reubicada con Éxito',
      detail: `La opción "${hija.strNombre}" se movió a la carpeta "${padreDestino.strNombre}".`,
    });

    this.itemArrastrado.set(null);
  }

  onDragEnd() {
    this.itemArrastrado.set(null);
    this.carpetaDestinoHover.set(null);
  }

  // ==========================================
  // MÉTODOS DEL CONSTRUCTOR DE MENÚS POR ROL
  // ==========================================

  abrirModalAgregarOpcionARol(padreId: number) {
    this.carpetaDestinoParaAgregarOpcion = padreId;
    this.filtroBusquedaCatalogoOpciones = '';
    this.dialogSeleccionarOpcionCatalogo.set(true);
  }

  abrirModalAgregarPadreARol() {
    this.filtroBusquedaCatalogoPadres = '';
    this.dialogSeleccionarPadreCatalogo.set(true);
  }

  asignarOpcionExistenteAlRol(hija: IOpcion) {
    const pId = this.carpetaDestinoParaAgregarOpcion || (this.opcionesPadreList()[0]?.intPadreOpcion || 1);
    const padre = this.opcionesPadreList().find((p) => p.intPadreOpcion === pId);
    const optExistente = this.opcionesMatriz().find((o) => o.intIdOpcion === hija.intIdOpcion);

    if (optExistente) {
      optExistente.activo = true;
      optExistente.intPadreOpcion = pId;
      optExistente.strPadreNombre = padre?.strNombre || optExistente.strPadreNombre;
      optExistente.strPadreIcono = padre?.strIcono || optExistente.strPadreIcono;
      optExistente.bitInsertar = true;
      optExistente.bitModificar = true;
      optExistente.bitEliminar = true;
    } else {
      const nuevaOpc: IOpcionMenuMatriz = {
        intIdOpcion: hija.intIdOpcion,
        strNombre: hija.strNombre,
        strDescripcion: hija.strDescripcion,
        strUrl: hija.strUrl,
        strIcono: this.normalizarIcono(hija.strIcono, hija.strUrl, hija.strNombre),
        intOrden: hija.intOrden || this.opcionesMatriz().length + 1,
        intPadreOpcion: pId,
        strPadreNombre: padre?.strNombre || 'General',
        strPadreIcono: padre?.strIcono || 'pi pi-folder',
        activo: true,
        bitInsertar: true,
        bitModificar: true,
        bitEliminar: true,
      };
      this.opcionesMatriz.set([...this.opcionesMatriz(), nuevaOpc]);
    }

    this.opcionesMatriz.set([...this.opcionesMatriz()]);
    this.cambiosPendientes.set(true);
    this.dialogSeleccionarOpcionCatalogo.set(false);
    this.messageService.add({
      severity: 'success',
      summary: 'Ruta Hija Asignada al Rol',
      detail: `"${hija.strNombre}" se asignó al menú padre "${padre?.strNombre || 'Módulo'}".`,
    });
  }

  asignarPadreExistenteAlRol(padre: IPadreOpcion) {
    const set = new Set(this.padresAgregadosAlRol());
    set.add(padre.intPadreOpcion);
    this.padresAgregadosAlRol.set(set);
    this.dialogSeleccionarPadreCatalogo.set(false);
    this.cambiosPendientes.set(true);
    this.messageService.add({
      severity: 'success',
      summary: 'Menú Padre Agregado al Rol',
      detail: `Se añadió el menú padre "${padre.strNombre}" a la estructura de este rol.`,
    });
  }

  quitarOpcionDelRol(opc: IOpcionMenuMatriz) {
    opc.activo = false;
    this.opcionesMatriz.set([...this.opcionesMatriz()]);
    this.cambiosPendientes.set(true);
    this.messageService.add({
      severity: 'info',
      summary: 'Ruta Hija Desactivada del Rol',
      detail: `"${opc.strNombre}" se desmarcó de este rol.`,
    });
  }

  quitarCarpetaDelRol(padreId: number) {
    this.opcionesMatriz().forEach((o) => {
      if (o.intPadreOpcion === padreId) {
        o.activo = false;
      }
    });
    const set = new Set(this.padresAgregadosAlRol());
    set.delete(padreId);
    this.padresAgregadosAlRol.set(set);
    this.opcionesMatriz.set([...this.opcionesMatriz()]);
    this.cambiosPendientes.set(true);
    this.messageService.add({
      severity: 'info',
      summary: 'Menú Padre Removido del Rol',
      detail: 'Se desvincularon las rutas hijas de este menú padre para este rol.',
    });
  }

  onDropEnPadreRol(event: DragEvent, padreDestinoId: number) {
    event.preventDefault();
    this.carpetaDestinoHover.set(null);
    const item = this.itemArrastrado();
    if (!item) return;

    const opcId = item.intIdOpcion;
    const opt = this.opcionesMatriz().find((o) => o.intIdOpcion === opcId);
    if (opt) {
      opt.intPadreOpcion = padreDestinoId;
      opt.activo = true;
      const padre = this.opcionesPadreList().find((p) => p.intPadreOpcion === padreDestinoId);
      if (padre) {
        opt.strPadreNombre = padre.strNombre;
        opt.strPadreIcono = padre.strIcono;
      }
      this.opcionesMatriz.set([...this.opcionesMatriz()]);
      this.cambiosPendientes.set(true);
      this.messageService.add({
        severity: 'success',
        summary: 'Ruta Hija Reubicada en el Rol',
        detail: `"${opt.strNombre}" se movió al menú padre "${padre?.strNombre || 'Módulo'}".`,
      });
    }
    this.itemArrastrado.set(null);
  }

  // ==========================================
  // MÉTODOS DE ELIMINACIÓN CON VALIDACIÓN DE HIJOS
  // ==========================================

  solicitarEliminarPadre(padre: IPadreOpcion, totalHijas?: number) {
    const hijasCount = totalHijas !== undefined
      ? totalHijas
      : (this.opcionesMatriz().filter((o) => o.intPadreOpcion === padre.intPadreOpcion).length);

    if (hijasCount > 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'No se puede eliminar el Menú Padre',
        detail: `El menú padre "${padre.strNombre}" contiene ${hijasCount} ${hijasCount === 1 ? 'ruta hija asociada' : 'rutas hijas asociadas'}. Debe eliminar o reasignar todas las rutas hijas antes de borrar este menú padre.`,
      });
      return;
    }

    this.itemAEliminar.set({
      tipo: 'padre',
      id: padre.intPadreOpcion,
      nombre: padre.strNombre,
      totalHijas: 0,
    });
    this.dialogConfirmacionEliminar.set(true);
  }

  solicitarEliminarHija(hija: IOpcion) {
    this.itemAEliminar.set({
      tipo: 'hija',
      id: hija.intIdOpcion,
      nombre: hija.strNombre,
    });
    this.dialogConfirmacionEliminar.set(true);
  }

  confirmarEliminacion() {
    const item = this.itemAEliminar();
    if (!item) return;

    this.eliminando.set(true);

    if (item.tipo === 'padre') {
      this.seguridadService.eliminarOpcionPadre(item.id).subscribe({
        next: (res: any) => {
          this.eliminando.set(false);
          this.dialogConfirmacionEliminar.set(false);
          if (res && res.count === -1) {
            this.messageService.add({
              severity: 'warn',
              summary: 'Atención',
              detail: res.message || 'No se pudo eliminar el menú padre.',
            });
            return;
          }
          this.messageService.add({
            severity: 'success',
            summary: 'Menú Padre Eliminado',
            detail: `"${item.nombre}" se eliminó correctamente.`,
          });
          if (this.elementoSeleccionado()?.tipo === 'padre' && this.elementoSeleccionado()?.id === item.id) {
            this.elementoSeleccionado.set(null);
          }
          this.cargarOpcionesYPadres();
          this.cargarMatrizPermisosRol(this.rolSeleccionadoPermisos() || 1);
        },
        error: () => {
          this.eliminando.set(false);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo eliminar el menú padre.',
          });
        },
      });
    } else {
      this.seguridadService.eliminarOpcionHija(item.id).subscribe({
        next: () => {
          this.eliminando.set(false);
          this.dialogConfirmacionEliminar.set(false);
          this.messageService.add({
            severity: 'success',
            summary: 'Ruta Hija Eliminada',
            detail: `La ruta hija "${item.nombre}" fue eliminada correctamente.`,
          });
          if (this.elementoSeleccionado()?.tipo === 'hija' && this.elementoSeleccionado()?.id === item.id) {
            this.elementoSeleccionado.set(null);
          }
          this.cargarOpcionesYPadres();
          this.cargarMatrizPermisosRol(this.rolSeleccionadoPermisos() || 1);
        },
        error: () => {
          this.eliminando.set(false);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo eliminar la ruta hija.',
          });
        },
      });
    }
  }

  getSeverityRol(rolNombre: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    const r = (rolNombre || '').toUpperCase();
    if (r.includes('ADMIN')) return 'danger';
    if (r.includes('DOCENTE')) return 'info';
    if (r.includes('ESTUDIANTE')) return 'success';
    if (r.includes('GUARDIA')) return 'warn';
    if (r.includes('INVITADO')) return 'secondary';
    if (r.includes('GESTION') || r.includes('VINCULACION')) return 'info';
    return 'secondary';
  }
}
