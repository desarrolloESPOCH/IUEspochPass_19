// cspell:disable

import { IEnvironment } from './interfaces/IEnvironment.interfaces';

export const environment: IEnvironment = {
  production: true,
  env: 'movil',
  CAS_SERVER_URL: 'https://seguridad.espoch.edu.ec/cas',
  REDIRECT_URI: 'https://pyariel.espoch.edu.ec:8080',
  SERVICIO_WEB: 'https://pyariel.espoch.edu.ec:5000/wsespochpass',
  VALIDATE:
    'https://pyariel.espoch.edu.ec:5000/wsespochpass/cas/serviceValidate',
  URL_MICROSOFT:
    'https://login.microsoftonline.com/common/oauth2/logout?post_logout_redirect_uri',
  FOTO_TTHH:
    'https://apicarnetdigital.espoch.edu.ec/WSEspochPass/getFotoFuncionario',
  FOTO_ACADEMICO:
    'https://apicarnetdigital.espoch.edu.ec/WSEspochPass/getFotoEstudiante',
  URL_CENTRAL: 'https://centralizada2.espoch.edu.ec/rutaCentral',
  CARGO_DEPENCENCIA:
    'https://apitalentohumano2.espoch.edu.ec/api_v1/m_servidor/servidor/estado_vinculacion',
  RUTA_TOKEN_TTHH: 'https://apitalentohumano2.espoch.edu.ec/api_v1/auth/login',
};
