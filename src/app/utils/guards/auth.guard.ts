import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SwCasService } from '../cas/sw-cas.service';

export const authGuard: CanActivateFn = (route, state) => {
  const swCas = inject(SwCasService);
  const router = inject(Router);

  const userInfo = swCas.getUserInfo();
  
  if (userInfo && userInfo.per_id && userInfo.per_id !== 'undefined' && userInfo.per_id.trim() !== '') {
    return true;
  }

  console.warn('Sesión caducada o no iniciada. Redirigiendo a inicio/login...');
  swCas.removeSession();
  router.navigate(['/']);
  return false;
};
