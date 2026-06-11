// cspell:disable
import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  constructor(@Inject(DOCUMENT) private doc: Document) {
    // Inicializar el tema en base a localStorage. Por defecto es falso (modo claro).
    const isDarkSaved = localStorage.getItem('darkTheme') === 'true';
    this.activeDarkTheme(isDarkSaved);
  }

  activeDarkTheme = (option: boolean) => {
    localStorage.setItem('darkTheme', option.toString());
    if (option) {
      this.doc.documentElement.classList.add('app-dark');
    } else {
      this.doc.documentElement.classList.remove('app-dark');
    }
  };
}
