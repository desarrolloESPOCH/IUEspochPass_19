import { swUsuariosService } from '../../services/usuarios/Usuarios.service';

export const obtenerToken = async (swUser: swUsuariosService) => {
  const { token } = await swUser.getAccesoTokenTTHH_SYNC();
  return token;
};
