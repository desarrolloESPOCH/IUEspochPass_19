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
  IGuardiaAdmin,
} from '../../../../services/admin/AdminCarnets.service';

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
  ],
  providers: [MessageService],
  templateUrl: './pg-admin-guardias.component.html',
  styleUrl: './pg-admin-guardias.component.css',
})
export default class PgAdminGuardiasComponent implements OnInit {
  private adminService = inject(AdminCarnetsService);
  private messageService = inject(MessageService);

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

    this.adminService.cambiarEstadoGuardia(guardia.intPersona, nuevoEstado).subscribe({
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

    this.saving.set(true);
    const body: any = {
      strCedula: cedulaLimpia,
      strNombres: nombresFinal,
      strApellidos: apellidosFinal,
      strCorreo: correoFinal,
      strTelefono: telefonoFinal,
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
}
