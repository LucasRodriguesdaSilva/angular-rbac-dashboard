import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet],
  template: `
  <div class="auth-container">
    <router-outlet></router-outlet>
  </div> `,
  styles: [`
  .auth-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    width: 100vw;
    background-color: #f5f5f5;
  }
    `],
})
export class AuthLayout {}
