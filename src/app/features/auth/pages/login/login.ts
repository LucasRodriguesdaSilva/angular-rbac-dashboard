import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnDestroy,
} from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatCardModule } from '@angular/material/card';
import { AuthService } from '../../../../core/services/auth-service';
import { Router } from '@angular/router';
import { AuthMockBackend } from '../../../../core/mocks/auth-mock.backend';
import { MatIconModule } from '@angular/material/icon';
import { SecurityLog } from '../../../../core/services/security-log';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    MatProgressBarModule,
    MatIconModule,
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login implements OnDestroy {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private securityLog = inject(SecurityLog);
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  isLoading = false;
  errorMessage: string | null = null;
  loginForm: FormGroup;
  private failedAttempts = 0;
  private readonly MAX_ATTEMPTS = 3;

  public isBlocked = false;
  private readonly BLOCK_DURATION_MS = 15000
  private blockTimeoutId!: number

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid || this.isBlocked) return;

    this.isLoading = true;
    this.errorMessage = null;
    this.cdr.markForCheck();

    const { email, password } = this.loginForm.value;

    AuthMockBackend.login(email, password).subscribe({
      next: (response) => {
        this.failedAttempts = 0;
        this.authService.setSession(response.tokens, response.user);
        this.router.navigate(['/dashboard']);
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = err.message || 'Falha na autenticação.';
        this.isLoading = false;
        this.failedAttempts++;

        if (this.failedAttempts >= this.MAX_ATTEMPTS) {

          this.isBlocked = true
          this.errorMessage = `${this.MAX_ATTEMPTS} tentativas falhas. Bloqueado temporáriamente.`;

          // Grava silenciosamente o ataque no SIEM
          this.securityLog.logThreat('BRUTE_FORCE_ATTEMPT', '/auth/login', 'CRITICAL', email);

          this.blockTimeoutId = setTimeout(() => {
            this.isBlocked = false;
            this.failedAttempts = 0
            this.errorMessage = null
            this.cdr.markForCheck()
          }, this.BLOCK_DURATION_MS)
        } else {
          this.errorMessage = `Credenciais inválidas. Tentativa ${this.failedAttempts} de ${this.MAX_ATTEMPTS}.`;
        }

        this.cdr.markForCheck();
      },
    });
  }

  public ngOnDestroy(): void {

    if (this.blockTimeoutId) {
      clearTimeout(this.blockTimeoutId)
    }
    this.destroy$.next();
    this.destroy$.complete();
  }
}
