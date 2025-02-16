// cspell:disable
import { Component, inject, SimpleChanges } from '@angular/core';
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
  standalone: true,
  imports: [CommonModule, PanelMenuModule, SkeletonModule],
  templateUrl: './c-sidebar.component.html',
  styleUrl: './c-sidebar.component.css',
})
export class CSidebarComponent {
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

  cargarDataMenu = () => {
    this.swEventosServices.getRol().subscribe((rol: any) => {
      this.getItemsMenu(rol);
    });
  };

  getItemsMenu = (rol: number) => {
    console.log('rols: ', rol);
    const menuArmado = this.swMenu.getMenu(rol).subscribe((items) => {
      console.log('items---: ', items);
      const menu = this.swSidebar.createRolesMenu(
        items.data,
        this.obtenerRutas
      );
      console.log('menu: ', menu);
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
