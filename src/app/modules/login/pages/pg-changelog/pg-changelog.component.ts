import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { SwCasService } from '../../../../utils/cas/sw-cas.service';

export interface ChangelogItem {
  version: string;
  fecha: string;
  nuevasFunciones: string[];
  correcciones: string[];
  mejoras: string[];
}

@Component({
  selector: 'app-pg-changelog',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  templateUrl: './pg-changelog.component.html',
  styleUrl: './pg-changelog.component.css'
})
export default class PgChangelogComponent implements OnInit {
  private router = inject(Router);
  private swCas = inject(SwCasService);

  // Indica si el usuario está autenticado (para mostrar el botón adecuado)
  hasSession = signal<boolean>(false);

  // Pestaña activa: 'front' | 'back'
  activeTab = signal<'front' | 'back'>('front');

  // Datos del changelog para el Frontend (Aplicación)
  frontChanges = signal<ChangelogItem[]>([
    {
      version: '2.1.0',
      fecha: '23 Septiembre 2026',
      nuevasFunciones: [
        'Módulo de Administración de Carnets con búsqueda avanzada, gestión de estados y estadísticas en tiempo real.',
        'Módulo de Administración y Gestión de Guardias de seguridad institucional.',
        'Módulo de Registro y Control de Invitados para asignación de pases temporales.',
        'Soporte completo para Progressive Web App (PWA) con Service Worker, manifiesto web e instalación móvil.',
        'Módulo interactivo de escáner QR y pantalla de validación instantánea de credenciales con visualización de datos.',
        'Nuevo menú lateral de navegación administrativa y cabecera de dashboard con control de roles.'
      ],
      correcciones: [
        'Optimización y corrección en las validaciones de enrolamiento y expiración de carnet.',
        'Ajuste en la verificación de permisos CAS y protección de rutas administrativas mediante guards.',
        'Corrección de alineación visual y diseño responsivo en dashboard y lectura de códigos QR para pantallas móviles.'
      ],
      mejoras: [
        'Implementación del servicio ThemeService con soporte y persistencia de temas claro/oscuro y paleta corporativa.',
        'Rediseño visual de la tarjeta de carnet digital con efectos interactivos y soporte de gestos táctiles.',
        'Actualización y optimización de dependencias globales y estilos institucionales.',
        'Guía de configuración PWA y depuración móvil en la documentación técnica.'
      ]
    },
    {
      version: '2.0.0',
      fecha: '11 Junio 2026',
      nuevasFunciones: [
        'Soporte e integración completa con los servicios de Talento Humano (TTHH).',
        'Actualización a la versión 20 del módulo de enrolamiento y suplantación de usuario.',
        'Soporte para el ingreso y validación de estudiantes de postgrado.',
        'Nueva interfaz de enrolamiento y renovación de carnet.',
        'Mapeo y soporte para el rol y acceso de Guardias.'
      ],
      correcciones: [
        'Solucionado el flujo de enrolamiento cuando el tiempo del carnet ha expirado.',
        'Corregido el ingreso e inicio de sesión de docentes en el sistema.',
        'Solución al footer flotante para mantenerlo correctamente en la parte inferior.',
        'Corregida la búsqueda de tema visual en el almacenamiento de sesión.'
      ],
      mejoras: [
        'Configuración inicial de estilos corporativos y soporte de temas claro/oscuro.',
        'Migración y optimización de componentes visuales de Angular 17 a Angular 20.',
        'Integración del escáner de códigos QR y despliegue de información del carnet en tiempo real.',
        'Configuración y optimización de perfiles de producción.'
      ]
    },
    {
      version: '1.1.0',
      fecha: '18 Abril 2026',
      nuevasFunciones: [
        'Componente interactivo para visualización detallada del carnet digital.',
        'Generación en pantalla de códigos QR únicos.'
      ],
      correcciones: [
        'Solucionado el bug en la expiración temprana de sesión del CAS.'
      ],
      mejoras: [
        'Rediseño de botones de acción rápida y alineación responsiva en móviles.'
      ]
    },
    {
      version: '1.0.0',
      fecha: '10 Abril 2024',
      nuevasFunciones: [
        'Lanzamiento inicial de la interfaz de ESPOCH PASS.',
        'Pantalla de inicio de sesión integrada con CAS Institucional.',
        'Formularios de enrolamiento y carga de fotografías.',
        'Lector de QR para rol de guardia.'
      ],
      correcciones: [],
      mejoras: [
      ]
    }
  ]);

  // Datos del changelog para el Backend (Servicios)
  backChanges = signal<ChangelogItem[]>([
    {
      version: '1.3.0',
      fecha: '23 Septiembre 2026',
      nuevasFunciones: [
        'Servicios y controladores CRUD para el módulo administrativo de carnets (búsqueda, estados y estadísticas).',
        'Módulo y servicio de cuentas externas para registro, validación y gestión de invitados.',
        'Servicios de gestión, auditoría y control de accesos para personal de guardias.',
        'Validación directa de matrículas en base de datos y mecanismo fallback para estudiantes sin períodos regulares.',
        'Controlador y rutas específicas para administración de carnets y emisión de accesos.'
      ],
      correcciones: [
        'Ajuste en la consistencia de estados durante el cambio de vigencia y renovación de credenciales.',
        'Corrección en consultas de verificación de dependencias y roles de usuarios.'
      ],
      mejoras: [
        'Implementación del middleware de validación administrativa (validateAdmin.middleware) para protección de endpoints.',
        'Optimización de consultas SQL Server para reducción de tiempos de respuesta en validación QR.',
        'Reorganización modular de rutas (adminCarnet.router, admin.router, carnet.router).'
      ]
    },
    {
      version: '1.2.0',
      fecha: '11 Junio 2026',
      nuevasFunciones: [
        'Integración y actualización de los endpoints para consumo de servicios de TTHH (Talento Humano).',
        'Soporte para validación e ingreso de estudiantes de postgrado.',
        'Endpoint para listar y verificar el tipo de rol del usuario antes del ingreso oficial.',
        'Implementación de los servicios para la última matrícula registrada y control de dependencias.'
      ],
      correcciones: [
        'Solución al flujo de ingreso de personas y asignación de dependencias.',
        'Corrección en el cambio de estado de los usuarios y tokens.',
        'Eliminación de logs redundantes (console.log) en producción.'
      ],
      mejoras: [
        'Configuración de tokens y seguridad para el consumo de servicios académicos de la ESPOCH.',
        'Actualización de credenciales y parámetros de conexión para entornos de desarrollo y producción.',
        'Actualización y optimización de la estructura del index y ramas de respaldo.'
      ]
    },
    {
      version: '1.1.0',
      fecha: '18 Abril 2026',
      nuevasFunciones: [
        'Servicios para matrículas vigentes y periodos.',
        'Servicios de seguridad para verificación de permisos de guardia.'
      ],
      correcciones: [
        'Solución a la asignación de claves de servicios externos.'
      ],
      mejoras: [
        'Optimización de consultas SQL Server para el módulo de login y validación de usuarios.'
      ]
    },
    {
      version: '1.0.0',
      fecha: '10 Febrero 2026',
      nuevasFunciones: [
        'Estructura inicial de servicios Express.',
        'Pool de conexiones de SQL Server mediante el paquete mssql.',
        'Documentación inicial de endpoints con Swagger UI en la ruta /api-docs.'
      ],
      correcciones: [],
      mejoras: [
        'Configuración de middlewares de seguridad (CORS, Helmet).'
      ]
    }
  ]);

  ngOnInit(): void {
    const userInfo = this.swCas.getUserInfo();
    // Si per_id existe, consideramos que hay una sesión iniciada
    if (userInfo && userInfo.per_id) {
      this.hasSession.set(true);
    }
  }

  setTab(tab: 'front' | 'back'): void {
    this.activeTab.set(tab);
  }

  volver(): void {
    if (this.hasSession()) {
      this.router.navigateByUrl('/dashboard/users');
    } else {
      this.router.navigateByUrl('/');
    }
  }
}
