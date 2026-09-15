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
      {
        path: 'admin/carnets',
        loadComponent: () =>
          import('./../admin/pages/pg-admin-carnets/pg-admin-carnets.component'),
      },
      {
        path: 'admin/guardias',
        loadComponent: () =>
          import('./../admin/pages/pg-admin-guardias/pg-admin-guardias.component'),
      },
      {
        path: 'admin/invitados',
        loadComponent: () =>
          import('./../admin/pages/pg-admin-invitados/pg-admin-invitados.component'),
      },
      {
        path: 'changelog',
        loadComponent: () =>
          import('./pages/pg-changelog/pg-changelog.component'),
      },
    ],
  },
  {
    path: 'changelog',
    loadComponent: () =>
      import('./pages/pg-changelog/pg-changelog.component'),
  },
  {
    path: 'logout',
    loadComponent: () => import('./../../utils/cas/cas.component'),
  },

  {
    path: 'enrolamiento',
    loadComponent: () => import('./pages/pg-enrolar/pg-enrolar.component'),
  },
];
