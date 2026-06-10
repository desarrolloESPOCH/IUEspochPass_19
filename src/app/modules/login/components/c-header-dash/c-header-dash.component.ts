// cspell:disable
import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MenuItem } from 'primeng/api';
import { InputTextModule } from 'primeng/inputtext';
import { MenubarModule } from 'primeng/menubar';
import { CLineaRolComponent } from '../c-linea-rol/c-linea-rol.component';
import { environment } from '../../../../../environments/environment';
import { DropdownModule } from 'primeng/dropdown';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SkeletonModule } from 'primeng/skeleton';
import { IJsonUser, SwCasService } from '../../../../utils/cas/sw-cas.service';
import { IRol } from '../../../../services/usuarios/interfaces/IRol.interface';

import { swUsuariosService } from '../../../../services/usuarios/Usuarios.service';
import { EventosService } from '../../../../services/otros/EventosService';
import { ThemeService } from '../../../../services/theme/theme.service';

@Component({
    selector: 'app-c-header-dash',
    imports: [
        CommonModule,
        MenubarModule,
        InputTextModule,
        CLineaRolComponent,
        DropdownModule,
        FormsModule,
        SkeletonModule,
    ],
    templateUrl: './c-header-dash.component.html',
    styleUrl: './c-header-dash.component.css'
})
export class CHeaderDashComponent {
  private swCas = inject(SwCasService);
  private router = inject(Router);
  private swUser = inject(swUsuariosService);
  private swEventosServices = inject(EventosService);
  private themeService = inject(ThemeService);

  rolSeleccionado: any;
  userEmail: string = '';

  lstRoles = signal<IRol[]>([] as IRol[]);
  themeDark = signal<boolean>(false);
  idRolSeleccionado = signal<number>(1);

  items = computed<MenuItem[]>(() => {
    const isDark = this.themeDark();
    return [
      {
        label: this.userEmail,
        icon: 'pi pi-fw pi-bell',
        items: [
          {
            label: 'No hay notificaciones',
            icon: 'pi pi-fw pi-caret-down',
          },
          {
            label: isDark ? 'Modo claro' : 'Modo oscuro',
            icon: isDark ? 'pi pi-fw pi-sun' : 'pi pi-fw pi-moon',
            command: () => this.toggleTheme()
          }
        ],
      },
      {
        label: 'Cerrar Sesión',
        icon: 'pi pi-fw pi-power-off',
        command: () => this.logout()
      },
    ];
  });

  constructor() {
    this.userEmail = this.swCas.getUserInfo().per_email;
    const isDarkSaved = localStorage.getItem('darkTheme') === 'true';
    this.themeDark.set(isDarkSaved);
    this.getRoles();
  }

  toggleTheme = () => {
    const nextValue = !this.themeDark();
    this.themeDark.set(nextValue);
    this.themeService.activeDarkTheme(nextValue);
  };

  logout = () => {
    window.location.href = `${environment.URL_MICROSOFT}=${environment.CAS_SERVER_URL}/logout?service=${environment.REDIRECT_URI}/logout`;
  };

  onChangeRol = (event: any) => {
    this.idRolSeleccionado.set(event.value.intIdRol);
    sessionStorage.setItem('rol', this.idRolSeleccionado().toString());
    this.swEventosServices.cambiarRol(this.idRolSeleccionado());
    this.router.navigateByUrl('/dashboard/users');
  };

  getRoles = () => {
    this.swUser
      .getRolesByUser(Number(this.swCas.getUserInfo().per_id))
      .subscribe((roles: any) => {
        if (roles.count > 0) {
          this.lstRoles.set(roles.data);
          let selectRol =
            sessionStorage.getItem('rol') ??
            JSON.parse(this.lstRoles()[0].intIdRol.toString());

          sessionStorage.setItem('rol', selectRol);
          this.swEventosServices.cambiarRol(selectRol);
          this.rolSeleccionado = this.lstRoles().find(
            (rol: IRol) => rol.intIdRol === Number(selectRol)
          );
        }
      });
  };
}
