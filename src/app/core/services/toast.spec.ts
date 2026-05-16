import { TestBed } from '@angular/core/testing';
import { Toast } from './toast';
import { MatSnackBar } from '@angular/material/snack-bar';
import { vi } from 'vitest';

describe('Toast', () => {
  let service: Toast;
  let snackBarSpy: { open: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    snackBarSpy = {
      open: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        Toast,
        { provide: MatSnackBar, useValue: snackBarSpy }
      ]
    });

    service = TestBed.inject(Toast);
  });

  it('deve ser criado', () => {
    expect(service).toBeTruthy();
  });

  it('deve disparar o snackbar de sucesso com a estilização correta', () => {
    service.success('Operação realizada!');
    expect(snackBarSpy.open).toHaveBeenCalledWith('Operação realizada!', 'Fechar', {
      duration: 4000,
      panelClass: ['toast-success'],
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
  });

  it('deve disparar o snackbar de erro com a estilização correta', () => {
    service.error('Ocorreu um erro!');
    expect(snackBarSpy.open).toHaveBeenCalledWith('Ocorreu um erro!', 'Fechar', {
      duration: 4000,
      panelClass: ['toast-error'],
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
  });
});
