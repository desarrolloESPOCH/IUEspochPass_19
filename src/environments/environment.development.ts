// cspell:disable
import { IEnvironment } from './interfaces/IEnvironment.interfaces';

export const environment: IEnvironment = {
  production: false,
  env: 'Developer',
  CAS_SERVER_URL: 'https://seguridad.espoch.edu.ec/cas',
  REDIRECT_URI: 'https://localhost:8080',
  SERVICIO_WEB: 'http://localhost:5000/wsespochpass',
  VALIDATE: 'http://localhost:5000/wsespochpass/cas/serviceValidate',
  URL_MICROSOFT:
    'https://login.microsoftonline.com/common/oauth2/logout?post_logout_redirect_uri',
  FOTO_TTHH:
    'https://apicarnetdigital.espoch.edu.ec/WSEspochPass/getFotoFuncionario',
  FOTO_ACADEMICO: 'http://localhost:5000/WSEspochPass/getFotoEstudiante',
  URL_CENTRAL: 'https://centralizada2.espoch.edu.ec/rutaCentral',
  CARGO_DEPENCENCIA:
    'https://apitalentohumano2.espoch.edu.ec/api_v1/m_servidor/servidor/estado_vinculacion',
  RUTA_TOKEN_TTHH: 'https://apitalentohumano2.espoch.edu.ec/api_v1/auth/login',
};
