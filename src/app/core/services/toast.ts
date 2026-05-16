import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarHorizontalPosition, MatSnackBarVerticalPosition } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root',
})
export class Toast {
  private defaultDuration: number = 4000
  private verticalPosition: MatSnackBarVerticalPosition = 'top'
  private horizontalPosition: MatSnackBarHorizontalPosition = 'end'

  constructor(private snackBar: MatSnackBar) {}

  success(message: string): void {
    this.snackBar.open(message, 'Fechar', {
      duration: this.defaultDuration,
      panelClass: ['toast-success'],
      horizontalPosition: this.horizontalPosition,
      verticalPosition: this.verticalPosition
    })
  }

  error(message: string): void {
    this.snackBar.open(message, 'Fechar', {
      duration: this.defaultDuration,
      panelClass: ['toast-error'],
      horizontalPosition: this.horizontalPosition,
      verticalPosition: this.verticalPosition
    })
  }
}
