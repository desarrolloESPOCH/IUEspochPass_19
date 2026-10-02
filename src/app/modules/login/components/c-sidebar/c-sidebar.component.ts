// cspell:disable
import { Component, inject, OnInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PanelMenuModule } from 'primeng/panelmenu';
import { MenuItem } from 'primeng/api';
import { Router } from '@angular/router';
import { SideBarService } from '../../../../services/otros/SideBarService';

import { EventosService } from '../../../../services/otros/EventosService';

import { SkeletonModule } from 'primeng/skeleton';
import { swUsuariosService } from '../../../../services/usuarios/Usuarios.service';
import { SwCasService } from '../../../../utils/cas/sw-cas.service';
import { IResponse } from '../../../../services/usuarios/interfaces/IResponse.interface';

@Component({
    selector: 'app-c-sidebar',
    imports: [CommonModule, PanelMenuModule, SkeletonModule],
    templateUrl: './c-sidebar.component.html',
    styleUrl: './c-sidebar.component.css'
})
export class CSidebarComponent implements OnInit {
  items: MenuItem[] = [];
  private swSidebar = inject(SideBarService);
  private router = inject(Router);
  private swMenu = inject(swUsuariosService);
  private swEventosServices = inject(EventosService);

  constructor() {
    this.swEventosServices.rolCambiado.subscribe((rol: number) => {
      this.getItemsMenu(rol);
    });
  }

  ngOnInit() {
    const rolGuardado = sessionStorage.getItem('rol');
    if (rolGuardado) {
      this.getItemsMenu(Number(rolGuardado));
    }
  }

  cargarDataMenu = () => {
    this.swEventosServices.getRol().subscribe((rol: any) => {
      this.getItemsMenu(rol);
    });
  };

  getItemsMenu = (rol: number) => {
    const menuArmado = this.swMenu.getMenu(rol).subscribe((items) => {
      const menu = this.swSidebar.createRolesMenu(
        items.data,
        this.obtenerRutas
      );
      if (rol === 1) {
        menu.push({
          label: 'Gestión de Carnets',
          icon: 'pi pi-id-card',
          command: () => this.obtenerRutas('/dashboard/admin/carnets')
        });
        menu.push({
          label: 'Gestión de Guardias',
          icon: 'pi pi-shield',
          command: () => this.obtenerRutas('/dashboard/admin/guardias')
        });
        menu.push({
          label: 'Gestión de Invitados',
          icon: 'pi pi-users',
          command: () => this.obtenerRutas('/dashboard/admin/invitados')
        });
        menu.push({
          label: 'Historial de Accesos',
          icon: 'pi pi-calendar-clock',
          command: () => this.obtenerRutas('/dashboard/admin/historial-accesos')
        });
        menu.push({
          label: 'Usuarios, Roles y Menús',
          icon: 'pi pi-users-cog',
          command: () => this.obtenerRutas('/dashboard/admin/usuarios-roles')
        });
        menu.push({
          label: 'Logs de Auditoría',
          icon: 'pi pi-shield-check',
          command: () => this.obtenerRutas('/dashboard/admin/auditoria-logs')
        });
      } else if (rol === 6) {
        menu.push({
          label: 'Historial de Accesos',
          icon: 'pi pi-calendar-clock',
          command: () => this.obtenerRutas('/dashboard/admin/historial-accesos')
        });
        menu.push({
          label: 'Cambiar Contraseña',
          icon: 'pi pi-key',
          command: () => this.swEventosServices.abrirCambioPassword.emit()
        });
      } else if (rol === 4 || rol === 5) {
        menu.push({
          label: 'Cambiar Contraseña',
          icon: 'pi pi-key',
          command: () => this.swEventosServices.abrirCambioPassword.emit()
        });
      }
      menu.push({
        label: 'Historial de Cambios',
        icon: 'pi pi-history',
        command: () => this.obtenerRutas('/dashboard/changelog')
      });

      this.items = menu;
    });
  };


  obtenerRutas = (url: string) => {
    this.router.navigateByUrl(url);
  };

  toggleTimeLine = () => {
    this.swEventosServices.toggleTimeLine(true);
  };
}
