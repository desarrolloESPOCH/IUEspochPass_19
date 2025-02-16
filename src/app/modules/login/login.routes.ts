import { Routes } from '@angular/router';
import { PgDashBoardComponent } from './pages/pg-dash-board/pg-dash-board.component';

// cspell:disable
export const routesLogin: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/pg-login/pg-login.component'),
  },
  {
    path: 'cas',
    loadComponent: () => import('./../../utils/cas/cas.component'),
  },
  {
    path: 'dashboard',
    component: PgDashBoardComponent,
    children: [
      {
        path: 'users',
        loadChildren: () =>
          import('./../users/users.routes').then((r) => r.routesUsers),
      },
    ],
  },
  // {
  //   path: 'dashboard',
  //   component: PgDashBoardComponent,
  //   children: [
  //     {
  //       path: 'welcome',
  //       loadComponent: () => import('./pages/pg-welcome/pg-welcome.component'),
  //     },
  //     {
  //       path: 'seguridad',
  //       loadChildren: () =>
  //         import('./../seguridad/login.routes').then((r) => r.routesSeguridad),
  //     },
  //     {
  //       path: 'persistencia',
  //       loadChildren: () =>
  //         import('./../persistencia/persistencia.routes').then(
  //           (r) => r.routesPersistencia
  //         ),
  //     },
  //     {
  //       path: 'planificacion',
  //       loadChildren: () =>
  //         import('./../planificacion/planificacion.routes').then(
  //           (r) => r.routesPlanificacion
  //         ),
  //     },
  //     {
  //       path: 'ejecucion',
  //       loadChildren: () =>
  //         import('./../ejecucion/ejecucion.routes').then(
  //           (r) => r.routesEjecucion
  //         ),
  //     },
  //     {
  //       path: 'reporteria',
  //       loadChildren: () =>
  //         import('./../reporteria/reporteria.routes').then(
  //           (r) => r.routesReporteria
  //         ),
  //     },
  //     {
  //       path: 'rectificacion',
  //       loadChildren: () =>
  //         import('./../rectificacion/rectificacion.routes').then(
  //           (r) => r.routesRectificacion
  //         ),
  //     },
  //   ],
  //   canActivate: [loginGuard],
  // },

  // {
  //   path: 'logout',
  //   loadComponent: () =>
  //     import('./pages/pg-logout/pg-logout.component').then(
  //       (m) => m.PgLogoutComponent
  //     ),
  // },
  // {
  //   path: 'server-down',
  //   loadComponent: () =>
  //     import('./pages/pg-server-down/pg-server-down.component').then(
  //       (m) => m.PgServerDownComponent
  //     ),
  // },
  // {
  //   path: 'Unauth',
  //   loadComponent: () =>
  //     import('./pages/pg-no-auth/pg-no-auth.component').then(
  //       (m) => m.PgNoAuthComponent
  //     ),
  // },
];
