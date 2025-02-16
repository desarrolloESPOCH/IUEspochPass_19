import { Routes } from '@angular/router';
import { PgCarnetComponent } from './pages/pg-carnet/pg-carnet.component';
import { PgInfoQrComponent } from './pages/pg-info-qr/pg-info-qr.component';
import { PgLectorQrComponent } from './pages/pg-lector-qr/pg-lector-qr.component';
import PgValidarQrComponent from './pages/pg-validar-qr/pg-validar-qr.component';

// cspell:disable
export const routesUsers: Routes = [
  {
    path: '',
    component: PgCarnetComponent,
  },
  {
    path: 'qr',
    component: PgInfoQrComponent,
  },
  {
    path: 'lector',
    component: PgLectorQrComponent,
  },
  {
    path: 'validarQr/:codigoQr',
    component: PgValidarQrComponent,
  },
];
