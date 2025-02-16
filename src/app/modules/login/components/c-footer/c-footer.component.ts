import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../../../services/theme/theme.service';
import { SwCasService } from '../../../../utils/cas/sw-cas.service';

@Component({
  selector: 'app-c-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './c-footer.component.html',
  styleUrl: './c-footer.component.css',
})
export class CFooterComponent {
  CODIGO_DEV = '20959';
  private changeTheme = inject(ThemeService);
  swCas = inject(SwCasService);
  dev = signal(this.swCas.getUserInfo().per_id);
  stateTheme: boolean = false;

  toggle = () => {
    let state: string = localStorage.getItem('darkTheme') || 'false';
    this.stateTheme = state == 'true' ? true : false;
    this.changeTheme.activeDarkTheme(!this.stateTheme);
  };
}
