// cspell:disable
import { DOCUMENT } from '@angular/common';
import { Inject, Injectable, inject } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  constructor(@Inject(DOCUMENT) private doc: Document) {}
  activeDarkTheme = (option: boolean) => {
    let theme: string;
    theme = option ? THEME.DARK : THEME.LIGHT;

    let themeLink = this.doc.getElementById('app-theme') as HTMLLinkElement;
    localStorage.setItem('darkTheme', option.toString());
    themeLink.href = `/assets/theme/${theme}/theme.css`;
  };
}
//Diccionario
const themes = [
  {
    DARK: 'vela-purple',
    LIGHT: 'aura-light-cyan',
  },
  {
    DARK: 'vela-purple',
    LIGHT: 'saga-blue',
  },
  {
    DARK: 'tailwind',
    LIGHT: 'tailwind-light',
  },
];
enum THEME {
  DARK = 'vela-purple',
  LIGHT = 'lara-light-blue',
}
