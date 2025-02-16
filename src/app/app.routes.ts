import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () =>
      import('./modules/login/login.routes').then((r) => r.routesLogin),
  },
];
