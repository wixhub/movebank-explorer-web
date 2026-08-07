import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/dataset-catalog/dataset-catalog').then((m) => m.DatasetCatalog),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
