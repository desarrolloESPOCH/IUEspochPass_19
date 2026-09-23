// cspell:disable
import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MenuItem } from 'primeng/api';
import { InputTextModule } from 'primeng/inputtext';
import { MenubarModule } from 'primeng/menubar';
import { CLineaRolComponent } from '../c-linea-rol/c-linea-rol.component';
import { environment } from '../../../../../environments/environment';
import { Select } from 'primeng/select';
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
    Select,
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
  userEmail = signal<string>('');

  lstRoles = signal<IRol[]>([] as IRol[]);
  themeDark = computed(() => this.themeService.isDark());
  idRolSeleccionado = signal<number>(1);

  items = computed<MenuItem[]>(() => {
    const isDark = this.themeDark();
    return [
      {
        label: this.userEmail(),
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
    this.userEmail.set(this.swCas.getUserInfo().per_email);
    this.swCas.datosDeSesion$.subscribe((userInfo) => {
      if (userInfo) {
        this.userEmail.set(userInfo.per_email);
        this.getRoles();
      }
    });
  }

  toggleTheme = () => {
    this.themeService.toggleTheme();
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
    const perId = Number(this.swCas.getUserInfo().per_id);
    if (isNaN(perId) || !perId) {
      console.log('ID de persona no válido para obtener roles');
      return;
    }

    this.swUser
      .getRolesByUser(perId)
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
        } else {
          // Si no tiene roles (acceso), redirigir a enrolamiento
          this.router.navigateByUrl('/enrolamiento');
        }
      });
  };

  // SUPLANTAR USUARIO (MODO DESARROLLO)
  isDevMode = !environment.production;
  selectedMockUser: any;
  mockUsers = [
    { label: 'ADMIN PRUEBA', value: { per_email: 'admin@espoch.edu.ec', per_id: '1', cedula: '0600000001', nombres: 'ADMIN', apellidos: 'PRUEBA' } },
    { label: 'ALEXANDER BALDEON', value: { per_email: 'bryan.baldeon@espoch.edu.ec', per_id: '20959', cedula: '0706705159', nombres: 'BRYAN ALEXNDER', apellidos: 'BALDEON HERMIDA' } },
    { label: 'JOSE LUIS CONDO LEON', value: { per_email: 'jose.condo@espoch.edu.ec', per_id: '16778', cedula: '0604172296', nombres: 'JOSE LUIS', apellidos: 'CONDO LEON' } },
    { label: 'BETSABE DE LOS ANGELES VACA SANTILLAN', value: { per_email: 'betsabe.vaca@espoch.edu.ec', per_id: '182298', cedula: '0650007727', nombres: 'BETSABE DE LOS ANGELES', apellidos: 'VACA SANTILLAN' } },
    { label: 'ANAHI MAGALY ANDRADE PINO', value: { per_email: 'anahi.andrade@espoch.edu.ec', per_id: '80299', cedula: '0350212940', nombres: 'ANAHI MAGALY', apellidos: 'ANDRADE PINO' } },
    { label: 'EVELYN MISHEL TACURI TACURI', value: { per_email: 'mishel.tacuri@espoch.edu.ec', per_id: '98335', cedula: '0604402297', nombres: 'EVELYN MISHEL', apellidos: 'TACURI TACURI' } },
    { label: 'JERSON SEBASTIAN MARTINEZ PAGALO', value: { per_email: 'jersons.martinez@espoch.edu.ec', per_id: '248826', cedula: '0606087237', nombres: 'JERSON SEBASTIAN', apellidos: 'MARTINEZ PAGALO' } },
  ];

  async suplantarUsuario(event: any) {
    if (!this.isDevMode) {
      console.warn('Suplantación de usuarios no permitida en producción');
      return;
    }
    if (event.value) {
      // Guardar la información del usuario mockeado en la sesión directamente
      await this.swCas.saveInfo(event.value);

      // Determinar el rol de prueba y asignarlo
      let rol = 3; // Estudiante por defecto
      if (event.value.per_id === '1') {
        rol = 1; // Admin
      } else if (event.value.per_id === '2') {
        rol = 2; // Docente
      }

      sessionStorage.setItem('rol', rol.toString());
      this.swEventosServices.cambiarRol(rol);

      // Forzar recarga suave redirigiendo al dashboard de usuarios
      this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
        this.router.navigateByUrl('/dashboard/users');
      });
    }
  }
}
