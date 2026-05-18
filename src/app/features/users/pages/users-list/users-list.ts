import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UsersService } from '../../services/users-service';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import { ListUsersParams, UserManagement } from '../../models/user.models';
import { PaginatedUsers } from '../../models/user.models';
import { MatIconModule } from '@angular/material/icon';
@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './users-list.html',
  styleUrl: './users-list.scss',
})
export class UsersList implements OnInit, OnDestroy {
  private usersService = inject(UsersService);
  private destroy$ = new Subject<void>();
  private cdr = inject(ChangeDetectorRef);
  public dataSource = new MatTableDataSource<UserManagement>([]);
  public displayedColumns: string[] = ['name', 'email', 'role', 'status', 'createdAt'];
  public totalRecords = 0;
  public pageSize = 10;
  public currentPage = 1;
  public isLoading = false;

  public searchControl = new FormControl<string>('', { nonNullable: true });

  public ngOnInit(): void {
    this.loadUsers();
    this.setupFilters();
  }

  public ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadUsers(): void {
    setTimeout(() => {
      this.isLoading = true;
      this.cdr.markForCheck();
    });

    this.isLoading = true;
    const queryParams: ListUsersParams = {
      page: this.currentPage,
      limit: this.pageSize,
      filters: {
        search: this.searchControl.value,
        role: null, // Mapeado conforme sua alteração estrita
      },
    };

    this.usersService
      .listUsers(queryParams)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: PaginatedUsers) => {
          this.dataSource.data = response.data;
          this.totalRecords = response.total;

          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.isLoading = false;
          this.cdr.detectChanges();
        },
      });
  }

  private setupFilters(): void {
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        setTimeout(() => {
          this.currentPage = 1;
          this.loadUsers();
        });
      });
  }

  public onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadUsers();
  }
}
