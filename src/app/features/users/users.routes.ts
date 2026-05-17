import { Routes } from '@angular/router';
import { permissionGuard } from '../../core/guards/permission-guard';

export const USER_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/users-list/users-list').then((m) => m.UsersList),
    canActivate: [permissionGuard],
    data: { permission: 'users.read' },
  },
  {
    path: 'new',
    loadComponent: () => import('./pages/user-form/user-form').then((m) => m.UserForm),
    canActivate: [permissionGuard],
    data: { permission: 'users.create' },
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./pages/user-form/user-form').then((m) => m.UserForm),
    canActivate: [permissionGuard],
    data: { permission: 'users.update' },
  },
];
