// cspell:disable
import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MenuItem, MessageService } from 'primeng/api';
import { InputTextModule } from 'primeng/inputtext';
import { MenubarModule } from 'primeng/menubar';
import { CLineaRolComponent } from '../c-linea-rol/c-linea-rol.component';
import { environment } from '../../../../../environments/environment';
import { Select } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SkeletonModule } from 'primeng/skeleton';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { IJsonUser, SwCasService } from '../../../../utils/cas/sw-cas.service';
import { IRol } from '../../../../services/usuarios/interfaces/IRol.interface';

import { swUsuariosService } from '../../../../services/usuarios/Usuarios.service';
import { EventosService } from '../../../../services/otros/EventosService';
import { ThemeService } from '../../../../services/theme/theme.service';
import { AdminCarnetsService } from '../../../../services/admin/AdminCarnets.service';

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
    DialogModule,
    ToastModule,
    ButtonModule,
    TooltipModule,
  ],
  providers: [MessageService],
  templateUrl: './c-header-dash.component.html',
  styleUrl: './c-header-dash.component.css'
})
export class CHeaderDashComponent {
  private swCas = inject(SwCasService);
  private router = inject(Router);
  private swUser = inject(swUsuariosService);
  private swEventosServices = inject(EventosService);
  private themeService = inject(ThemeService);
  private adminService = inject(AdminCarnetsService);
  private messageService = inject(MessageService);

  rolSeleccionado: any;
  userEmail = signal<string>('');

  lstRoles = signal<IRol[]>([] as IRol[]);
  themeDark = computed(() => this.themeService.isDark());
  idRolSeleccionado = signal<number>(1);

  // Modal Cambiar Contraseña de Perfil
  dialogPassword = signal<boolean>(false);
  guardandoPassword = signal<boolean>(false);
  datosUsuarioActual: any = null;
  nuevaClave: string = '';
  correoNotificacionClave: string = '';
  notificarPorCorreo: boolean = true;

  items = computed<MenuItem[]>(() => {
    const isDark = this.themeDark();
    return [
      {
        label: this.userEmail() || 'Mi Perfil',
        icon: 'pi pi-fw pi-user',
        items: [
          {
            label: 'No hay notificaciones',
            icon: 'pi pi-fw pi-bell',
          },
          {
            label: isDark ? 'Modo claro' : 'Modo oscuro',
            icon: isDark ? 'pi pi-fw pi-sun' : 'pi pi-fw pi-moon',
            command: () => this.toggleTheme()
          },
          {
            label: 'Cambiar Contraseña',
            icon: 'pi pi-fw pi-key',
            command: () => this.abrirModalPassword()
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

    // Escuchar evento para abrir modal desde cualquier parte (p.ej. sidebar de guardia/invitado)
    this.swEventosServices.abrirCambioPassword.subscribe(() => {
      this.abrirModalPassword();
    });
  }

  // ==========================================
  // CAMBIO DE CONTRASEÑA DE PERFIL
  // ==========================================

  abrirModalPassword() {
    const userInfo = this.swCas.getUserInfo();
    this.datosUsuarioActual = userInfo;
    this.correoNotificacionClave = userInfo?.per_email && userInfo.per_email !== 'undefined' ? userInfo.per_email : '';
    this.nuevaClave = this.generarPasswordAleatorio();
    this.notificarPorCorreo = true;
    this.dialogPassword.set(true);
  }

  generarPasswordAleatorio(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  generarNuevaClaveManual() {
    this.nuevaClave = this.generarPasswordAleatorio();
  }

  guardarPassword() {
    const userInfo = this.datosUsuarioActual || this.swCas.getUserInfo();
    const cedula = userInfo?.cedula || userInfo?.per_cedula || userInfo?.user || '';

    if (!cedula) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo identificar la cédula de su usuario.',
      });
      return;
    }

    if (!this.nuevaClave || this.nuevaClave.trim().length < 4) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Contraseña no válida',
        detail: 'La contraseña debe tener al menos 4 caracteres.',
      });
      return;
    }

    if (this.notificarPorCorreo && (!this.correoNotificacionClave || !this.correoNotificacionClave.includes('@'))) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Correo inválido',
        detail: 'Ingrese un correo electrónico válido para enviar las credenciales.',
      });
      return;
    }

    this.guardandoPassword.set(true);

    const nombres = `${userInfo?.nombres || userInfo?.per_nombres || ''} ${userInfo?.apellidos || userInfo?.per_apellidos || ''}`.trim();
    const rolActual = this.rolSeleccionado?.strNombre || 'USUARIO';

    this.adminService
      .cambiarPassword({
        strCedula: cedula,
        nuevaClave: this.nuevaClave.trim(),
        strCorreo: this.correoNotificacionClave.trim(),
        strNombres: nombres,
        rol: rolActual,
        notificarCorreo: this.notificarPorCorreo,
        adminInfo: userInfo,
      })
      .subscribe({
        next: (res) => {
          this.guardandoPassword.set(false);
          this.dialogPassword.set(false);
          this.messageService.add({
            severity: 'success',
            summary: 'Contraseña Actualizada',
            detail: res.message || 'Su contraseña ha sido actualizada exitosamente.',
          });
        },
        error: (err) => {
          this.guardandoPassword.set(false);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: err.error?.message || 'No se pudo actualizar la contraseña.',
          });
        },
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
    { label: 'RITA EULALIA LLIGUILEMA BOCON', value: { per_email: 'rita.lliguilema@espoch.edu.ec', per_id: '296625', cedula: '0605270362', nombres: 'RITA EULALIA', apellidos: 'LLIGUILEMA BOCON' } },
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
