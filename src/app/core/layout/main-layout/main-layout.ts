import { Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { AuthService } from '../../services/auth-service';
import { CommonModule } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { RouterModule } from '@angular/router';
import { MatDividerModule } from '@angular/material/divider';
import { HasPermission } from '../../../shared/directives/has-permission';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatDividerModule,
    HasPermission
  ],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss',
})
export class MainLayout {
  private authService = inject(AuthService);

  public userRole = computed(() => this.authService.currentUserValue?.role || 'USER');
  public userName = computed(() => this.authService.currentUserValue?.name || 'Usuário');
  public userEmail = computed(() => this.authService.currentUserValue?.email || '');

  public onLogout(): void {
    this.authService.logout();
  }
}
