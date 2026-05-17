import { Routes } from "@angular/router";
import { permissionGuard } from "../../core/guards/permission-guard";

export const AUDIT_LOGS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/logs-list/logs-list').then(m => m.LogsList),
    canActivate: [permissionGuard],
    data: { permission: 'logs.read' }
  }
]
