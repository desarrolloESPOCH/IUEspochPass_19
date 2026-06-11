import { swUsuariosService } from '../../services/usuarios/Usuarios.service';

export const obtenerToken = async (swUser: swUsuariosService) => {
  const { data } = await swUser.getAccesoTokenTTHH_SYNC();
  return data;
};
