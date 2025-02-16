import { Injectable } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { BehaviorSubject, Observable, take } from 'rxjs';
// import { IOpcion, IPadre } from '../../core/interfaces/ISeguridad.interface';

@Injectable({
  providedIn: 'root',
})
export class SideBarService {
  private _itemsMenu = new BehaviorSubject<MenuItem[]>([] as MenuItem[]);
  public itemsMenu$ = this._itemsMenu.asObservable();

  public get itemsMenu(): Observable<any[]> {
    return this._itemsMenu.asObservable();
  }

  public set itemsMenu(items: MenuItem[]) {
    this._itemsMenu.next(items);
  }

  constructor() {}

  createRolesMenu(rolesData: any[], fn: Function): MenuItem[] {
    const rolesMenu: MenuItem[] = rolesData.map((rol: any, index: number) => ({
      label: rol.strPadre,
      icon: rol.strIconoPadre,
      items: rol.hijos.map((hijo: any) => ({
        label: hijo.strOpcion,
        icon: hijo.strIconoOpcion,
        command: (event: any) => {
          fn(hijo.strUrlOpcion);
        },
      })),
    }));

    return rolesMenu;
  }
}
