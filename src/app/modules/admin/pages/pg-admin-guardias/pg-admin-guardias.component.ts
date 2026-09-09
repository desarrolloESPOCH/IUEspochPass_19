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
        const list = res.data || [];
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

    this.searchingPersona.set(true);
    this.personaPreview = null;
    this.mostrarCamposManuales.set(false);

    this.adminService.getPersonaCarnet(this.cedulaNuevoGuardia.trim()).subscribe({
      next: (res) => {
        this.searchingPersona.set(false);
        if (res && res.data && res.data.length > 0) {
          this.personaPreview = res.data[0];
        } else {
          // Si no está registrado en el sistema local, activar campos para registro
          this.mostrarCamposManuales.set(true);
          this.messageService.add({
            severity: 'info',
            summary: 'Persona no registrada',
            detail: 'La persona se registrará automáticamente al guardar o complete sus nombres.',
          });
        }
      },
      error: () => {
        this.searchingPersona.set(false);
        this.mostrarCamposManuales.set(true);
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

    this.saving.set(true);
    const body: any = {
      strCedula: this.cedulaNuevoGuardia.trim(),
    };

    if (this.mostrarCamposManuales()) {
      body.strNombres = this.nuevoNombres.trim();
      body.strApellidos = this.nuevoApellidos.trim();
      body.strCorreo = this.nuevoCorreo.trim();
      body.strTelefono = this.nuevoTelefono.trim();
    }

    this.adminService.agregarGuardia(body).subscribe({
      next: (res) => {
        this.saving.set(false);
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
