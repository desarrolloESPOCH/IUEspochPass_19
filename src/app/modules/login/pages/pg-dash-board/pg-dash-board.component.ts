import { CardModule } from 'primeng/card';
import { Component, ElementRef, inject } from '@angular/core';

import { MenuItem } from 'primeng/api';
import { CHeaderDashComponent } from '../../components/c-header-dash/c-header-dash.component';
import { CSidebarComponent } from '../../components/c-sidebar/c-sidebar.component';
import { CFooterComponent } from '../../components/c-footer/c-footer.component';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { SidebarModule } from 'primeng/sidebar';

@Component({
  selector: 'app-pg-dash-board',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    // CardModule,
    BreadcrumbModule,
    CHeaderDashComponent,
    CSidebarComponent,
    CFooterComponent,
    SidebarModule,
    // CTimeLineComponent,
    // CaminoComponent,
    // LoadingComponent,
    // InformacionProcesoComponent,
  ],
  templateUrl: './pg-dash-board.component.html',
  styleUrl: './pg-dash-board.component.css',
})
export class PgDashBoardComponent {
  items: MenuItem[] | undefined;
  home: MenuItem | undefined;
  sidebarVisible: boolean = false;
  sidebarTimeVisible: boolean = false;

  isExpand: boolean = false;
  // swEventosServices = inject(EventosService);

  constructor() {
    // this.swEventosServices.getTimeLine().subscribe((value) => {
    //   this.sidebarTimeVisible = value;
    //   this.sidebarVisible = false;
    // });
  }
  ngOnInit() {
    this.items = [
      { label: 'Home' },
      // { label: 'Notebook' },
      // { label: 'Accessories' },
      // { label: 'Backpacks' },
      // { label: 'Backpacks' },
      // { label: 'Computer' },
      // { label: 'Notebook' },
      // { label: 'Accessories' },
    ];

    this.home = { icon: 'pi pi-home', routerLink: '/dashboard/welcome' };
  }

  toggleButton = () => {
    this.isExpand = !this.isExpand;
  };
}
