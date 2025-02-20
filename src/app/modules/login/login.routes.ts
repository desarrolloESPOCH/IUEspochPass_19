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

  {
    path: 'enrolamiento',
    loadComponent: () => import('./pages/pg-enrolar/pg-enrolar.component'),
  },
];
