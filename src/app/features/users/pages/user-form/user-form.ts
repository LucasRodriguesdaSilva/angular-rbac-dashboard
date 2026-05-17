import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { UsersService } from '../../services/users-service';
import { Toast } from '../../../../core/services/toast';
import { UserPermission, UserRole } from '../../../../core/models/auth.models';

@Component({
  selector: 'app-user-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './user-form.html',
  styleUrl: './user-form.scss',
})
export class UserForm implements OnInit {
  private fb = inject(FormBuilder);
  private usersService = inject(UsersService);
  private toastService = inject(Toast);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  public userForm!: FormGroup;
  public isEditMode = false;
  public isLoading = false;
  private userId: string | null = null;

  public availablePermissions: { value: UserPermission; label: string }[] = [
    { value: 'users.read', label: 'Ler Usuários' },
    { value: 'users.create', label: 'Criar Usuários' },
    { value: 'users.update', label: 'Editar Usuários' },
    { value: 'users.delete', label: 'Excluir Usuários' },
    { value: 'logs.read', label: 'Visualizar Logs de Auditoria' },
  ];

  public availableRoles: UserRole[] = ['ADMIN', 'SUPPORT', 'USER'];
  public selectedPermissions: UserPermission[] = [];

  public ngOnInit(): void {
    this.buildForm();
    this.checkEditMode();
  }

  private buildForm(): void {
    this.userForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, this.strongPasswordValidator]],
      role: ['', [Validators.required]],
      active: [true],
    });
  }

  /**
   * Custom Validator: Engine de validação de entropia de credenciais (Senha Forte)
   * Exige: Mínimo 8 caracteres, 1 maiúscula, 1 minúscula, 1 número e 1 caractere especial.
   */
  private strongPasswordValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;

    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
    const valid = regex.test(control.value);

    return valid ? null : { weakPassword: true };
  }

  private checkEditMode(): void {
    this.userId = this.route.snapshot.paramMap.get('id');

    if (this.userId) {
      this.isEditMode = true;
      this.isLoading = true;

      this.userForm.get('password')?.clearValidators();
      this.userForm.get('password')?.updateValueAndValidity();

      this.usersService.getUserById(this.userId).subscribe({
        next: (user) => {
          this.userForm.patchValue({
            name: user.name,
            email: user.email,
            role: user.role,
            active: user.active,
          });

          this.selectedPermissions = user.permissions;
          this.isLoading = false;
        },
        error: () => {
          this.toastService.error('Erro ao carregar dados do usuário');
          this.isLoading = false;
        },
      });
    }
  }

  public onPermissionChange(permission: UserPermission, isChecked: boolean): void {
    if (isChecked) {
      if (!this.selectedPermissions.includes(permission)) {
        this.selectedPermissions.push(permission);
      }
    } else {
      this.selectedPermissions = this.selectedPermissions.filter((p) => p !== permission);
    }
  }
  public onSubmit(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const formValue = this.userForm.value;

    const payload = {
      name: formValue.name,
      email: formValue.email,
      role: formValue.role as UserRole,
      permissions: this.selectedPermissions,
      active: formValue.active,
    };

    if (this.isEditMode && this.userId) {
      this.usersService.updateUser(this.userId, payload).subscribe({
        next: () => {
          this.toastService.success('Usuário atualizado com sucesso no repositório.');
          this.router.navigate(['/users']);
        },
        error: () => {
          this.isLoading = false;
          this.toastService.error('Falha ao processar atualização.');
        },
      });
    } else {
      const createPayload = { ...payload, password: formValue.password };
      this.usersService.createUser(createPayload).subscribe({
        next: () => {
          this.toastService.success('Novo perfil cadastrado e claims vinculadas.');
          this.router.navigate(['/users']);
        },
        error: () => {
          this.isLoading = false;
          this.toastService.error('Falha ao cadastrar credencial.');
        },
      });
    }
  }
}
