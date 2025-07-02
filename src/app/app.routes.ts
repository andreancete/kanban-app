import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/board-list/board-list.component').then(
        (m) => m.BoardListComponent
      ),
  },
  {
    path: 'board/:id',
    loadComponent: () =>
      import('./components/board/board.component').then(
        (m) => m.BoardComponent
      ),
  },
  {
    path: 'diagnostic',
    loadComponent: () =>
      import('./components/diagnostic/diagnostic.component').then(
        (m) => m.DiagnosticComponent
      ),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
