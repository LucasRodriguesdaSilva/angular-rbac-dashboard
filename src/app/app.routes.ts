import { Routes } from '@angular/router';
import { AuthLayout } from './core/layout/auth-layout/auth-layout';
import { MainLayout } from './core/layout/main-layout/main-layout';
import { authGuard } from './core/guards/auth-guard';
// import { MainLayout } from './core/layout/main-layout/main-layout';
// import { authGuard } from './core/guards/auth-guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'auth/login',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    component: AuthLayout,
    children: [
      {
        path: 'login',
        loadComponent: () => import('./features/auth/pages/login/login').then(m => m.Login)
      }
    ]
  },
  {
    path: '',
    component: MainLayout,
    canActivate: [authGuard], // Primeira barreira: precisa estar logado
    children: [
      // {
      //   path: 'dashboard',
      //   loadComponent: () => import('./features/dashboard/pages/home/home.component').then(m => m.HomeComponent)
      // },
      {
        path: 'users',
        loadChildren: () => import('./features/users/users.routes').then(m => m.USER_ROUTES)
      },
      // {
      //   path: 'audit-logs',
      //   canActivate: [permissionGuard], // Segunda barreira para o time de CyberSec
      //   data: { permission: 'logs.read' },
      //   loadComponent: () => import('./features/audit-logs/pages/logs-list/logs-list.component').then(m => m.LogsListComponent)
      // }
    ]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
