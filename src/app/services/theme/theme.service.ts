// cspell:disable
import { DOCUMENT } from '@angular/common';
import { Inject, Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  isDark = signal<boolean>(false);

  constructor(@Inject(DOCUMENT) private doc: Document) {
    // Inicializar el tema en base a localStorage. Por defecto es falso (modo claro).
    const isDarkSaved = localStorage.getItem('darkTheme') === 'true';
    this.isDark.set(isDarkSaved);
    this.applyTheme(isDarkSaved);
  }

  activeDarkTheme = (option: boolean) => {
    this.isDark.set(option);
    localStorage.setItem('darkTheme', option.toString());
    this.applyTheme(option);
  };

  toggleTheme = () => {
    this.activeDarkTheme(!this.isDark());
  };

  private applyTheme(option: boolean) {
    if (option) {
      this.doc.documentElement.classList.add('app-dark');
      this.doc.documentElement.classList.add('dark');
      this.doc.documentElement.classList.remove('light');
    } else {
      this.doc.documentElement.classList.remove('app-dark');
      this.doc.documentElement.classList.remove('dark');
      this.doc.documentElement.classList.add('light');
    }
  }
}
