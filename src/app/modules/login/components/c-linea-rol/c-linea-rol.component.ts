import { Component, Input, SimpleChanges, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
// import { ROLES } from '../../../../enums/TipoRoles';

@Component({
  selector: 'app-c-linea-rol',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './c-linea-rol.component.html',
  styleUrl: './c-linea-rol.component.css',
})
export class CLineaRolComponent {
  @Input()
  color: number = 1;

  rol = signal('rol1');

  ngOnInit() {
    // this.getColorRol()
    this.rol.set(this.getColorRol());
  }

  ngOnChanges(change: SimpleChanges) {
    this.removeAnimateClass();
    setTimeout(() => {
      this.color = change['color'].currentValue;
      this.rol.set(this.getColorRol());
      this.addAnimateClass();
    });
  }

  removeAnimateClass = () => {
    const element = document.querySelector('.linea');
    if (element) element.classList.remove('animate');
  };

  addAnimateClass = () => {
    const element = document.querySelector('.linea');
    if (element) element.classList.add('animate');
  };
  getColorRol = () => {
    switch (this.color) {
      case 1:
        return 'rol1';
      case 2:
        return 'rol2';
      case 3:
        return 'rol3';
      case 4:
        return 'rol4';
      case 5:
        return 'rol5';
      case 6:
        return 'rol6';
      default:
        return 'rol1';
    }
  };
}
