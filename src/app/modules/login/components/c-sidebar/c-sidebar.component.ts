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
