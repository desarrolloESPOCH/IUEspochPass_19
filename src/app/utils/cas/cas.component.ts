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
      const validationResult = await firstValueFrom(
        this.swCas.validateTicketLocal(ticketSession)
      );
      let transformacion = await this.swCas.transformXmltoJson(
        validationResult
      );
      // console.log('transformacion: ', transformacion);
      // transformacion = {
      //   per_email: 'nestor.paguay@espoch.edu.ec',
      //   per_id: '11418',
      //   newLogin: '',
      //   cedula: '0604104596',
      //   nombres: 'NESTOR JHOVANY',
      //   apellidos: 'PAGUAY LLAMUCA',
      //   periodoAcademico: '',
      //   procesoEvaluacion: '',
      // };
      // transformacion = {
      //   per_email: 'paola.cuello@espoch.edu.ec',
      //   per_id: '81862',
      //   newLogin: '',
      //   cedula: '0650183924',
      //   nombres: 'PAOLA NATALY',
      //   apellidos: 'CUELLO LEON',
      //   periodoAcademico: '',
      //   procesoEvaluacion: '',
      // };
      // transformacion = {
      //   per_email: 'bryan.baldeon@espoch.edu.ec',
      //   per_id: '20959',
      //   newLogin: '',
      //   cedula: '0706705159',
      //   nombres: 'BRYAN ALEXANDER',
      //   apellidos: 'BALDEON HERMIDA',
      //   periodoAcademico: '',
      //   procesoEvaluacion: '',
      // };
      transformacion = {
        per_email: '',
        per_id: '212326',
        newLogin: '',
        cedula: '0606012888',
        nombres: 'JOSE LUIS',
        apellidos: 'VELASCO GAMARRA',
        periodoAcademico: '',
        procesoEvaluacion: '',
      };
      if (!transformacion.per_id) {
        console.log('NO ES USUARIO DE LA ESPOCH');
      }
      const roles = await firstValueFrom(
        this.swUsuario.validateRoles(Number(transformacion.per_id))
      );

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
      // window.location.href =
      //   'http://evaluacion.espoch.edu.ec/2/index.php?option=com_content&view=article&id=46&Itemid=59';
    }
  };
}
