import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { SwCasService } from './sw-cas.service';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
// import { Base64 } from 'js-base64';
import { firstValueFrom } from 'rxjs';
import { swUsuariosService } from '../../services/usuarios/Usuarios.service';
// import { environment } from '../../../environments/environment';

//cspell:disable

@Component({
  selector: 'app-cas',
  imports: [CommonModule, ToastModule],
  template: `<p-toast></p-toast>`,
  providers: [MessageService]
})
export default class CasComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private swCas = inject(SwCasService);
  private ticket = signal('');
  // private mensajeNotifica = inject(MessageService);

  private swUsuario = inject(swUsuariosService);

  constructor() {
    this.route.queryParams.subscribe(async (params: any) => {
      this.ticket.set(params['ticket']);
      if (this.ticket()) {
        try {
          await this.validate(this.ticket());
        } catch (error) {
          this.router.navigate(['/dashboard/welcome']);
        }
      } else {
        console.log('No se loguea aun');
        this.swCas.removeSession();
        this.router.navigate(['/']);
      }
    });
  }

  validate = async (ticketSession: any) => {
    try {
      let transformacion: any;

      let roles: any;
      
      // Si estamos suplantando (solo desarrollo), saltar la validacion real del ticket y roles
      const suplantarData = localStorage.getItem('suplantar_usuario');
      if (suplantarData) {
        transformacion = JSON.parse(suplantarData);
        // Mockear roles según el ID del usuario suplantado
        roles = {
          count: 1,
          data: [
            {
              intIdRol: transformacion.per_id === '1' ? 1 : (transformacion.per_id === '2' ? 2 : 3),
              strNombres: transformacion.nombres,
              strApellidos: transformacion.apellidos,
              strNombre: transformacion.per_id === '1' ? 'ADMINISTRADOR' : (transformacion.per_id === '2' ? 'DOCENTE' : 'ESTUDIANTE'),
              intEstado: 1
            }
          ]
        };
      } else {
        const validationResult = await firstValueFrom(
          this.swCas.validateTicketLocal(ticketSession)
        );
        transformacion = await this.swCas.transformXmltoJson(validationResult);
        
        if (!transformacion.per_id) {
          console.log('NO ES USUARIO DE LA ESPOCH');
        }
        
        roles = await firstValueFrom(
          this.swUsuario.validateRoles(Number(transformacion.per_id))
        );
      }

      if (roles.count == 0) {
        await this.swCas.saveInfo(transformacion);
        this.router.navigate(['/enrolamiento']);
        return;
      }

      transformacion.nombres = roles.data[0].strNombres;
      transformacion.apellidos = roles.data[0].strApellidos;
      await this.swCas.saveInfo(transformacion);

      this.router.navigate(['/dashboard/users']);
    } catch (e) {
      console.log('Error de validación', e);
    }
  };
}
