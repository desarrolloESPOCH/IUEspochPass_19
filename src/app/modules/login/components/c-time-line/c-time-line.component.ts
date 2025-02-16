import { Component } from '@angular/core';
import { TimelineModule } from 'primeng/timeline';
@Component({
  selector: 'app-c-time-line',
  standalone: true,
  imports: [TimelineModule],
  templateUrl: './c-time-line.component.html',
  styleUrl: './c-time-line.component.css',
})
export class CTimeLineComponent {
  events!: any[];

  constructor() {
    this.events = [
      {
        status: 'Migración de datos estudiantes',
        date: '15/10/2020 10:30',
        icon: 'pi pi-check',
        color: '#10d610',
        image: 'game-controller.jpg',
      },
      {
        status: 'Persistencia',
        date: '15/10/2020 14:00',
        icon: 'pi pi-spin pi-cog',
        color: '#1cbdee',
      },
      {
        status: 'Planificación',
        date: '15/10/2020 16:15',
        icon: 'pi pi-ban',
        color: '#323332',
      },
      {
        status: 'Finalizado',
        date: '16/10/2020 10:00',
        icon: 'pi pi-ban',
        color: '#323332',
      },
    ];
  }
}
