import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { SwCasService } from './sw-cas.service';
import { MessagesModule } from 'primeng/messages';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { Base64 } from 'js-base64';
import { firstValueFrom } from 'rxjs';
import { swUsuariosService } from '../../services/usuarios/Usuarios.service';
import { environment } from '../../../environments/environment';

//cspell:disable
@Component({
  selector: 'app-cas',
  standalone: true,
  imports: [CommonModule, MessagesModule, ToastModule],
  template: `<p-toast></p-toast>`,
  providers: [MessageService],
})
export default class CasComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private swCas = inject(SwCasService);
  private ticket = signal('');
  private mensajeNotifica = inject(MessageService);

  private swUsuario = inject(swUsuariosService);

  constructor() {
    this.route.queryParams.subscribe(async (params: any) => {
      this.ticket.set(params['ticket']);
      if (this.ticket()) {
        try {
          console.log('this.ticket(): ', this.ticket());
          await this.validate(this.ticket());
        } catch (error) {
          console.log('error: ', error);
          this.router.navigate(['/dashboard/welcome']);
        }
      } else {
        console.log('No se loguea aun');
      }
    });
  }

  validate = async (ticketSession: any) => {
    try {
      const validationResult = await firstValueFrom(
        this.swCas.validateTicketLocal(ticketSession)
      );
      let transformacion = await this.swCas.transformXmltoJson(
        validationResult
      );
      // console.log('transformacion: ', transformacion);
      // transformacion = {
      //   per_email: '',
      //   per_id: '179752',
      //   newLogin: 'true',
      //   cedula: '0605163971',
      //   nombres: 'ERICK ALEXANDER',
      //   apellidos: 'MELENDRES CALLE',
      //   periodoAcademico: '',
      //   procesoEvaluacion: 0,
      // };
      if (!transformacion.per_id) {
        console.log('NO ES USUARIO DE LA ESPOCH');
      }
      const roles = await firstValueFrom(
        this.swUsuario.validateRoles(Number(transformacion.per_id))
      );

      console.log('----roles: ', roles);
      if (roles.count == 0) {
        this.router.navigate(['/enrolamiento']);
      }

      transformacion.nombres = roles.data[0].strNombres;
      transformacion.apellidos = roles.data[0].strApellidos;
      await this.swCas.saveInfo(transformacion);

      this.router.navigate(['/dashboard/users']);
    } catch (e) {
      console.log('Error de validación', e);
      // window.location.href =
      //   'http://evaluacion.espoch.edu.ec/2/index.php?option=com_content&view=article&id=46&Itemid=59';
    }
  };
}
