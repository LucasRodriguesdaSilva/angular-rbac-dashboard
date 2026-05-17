import { Directive, inject, Input, TemplateRef, ViewContainerRef } from '@angular/core';
import { AuthService } from '../../core/services/auth-service';
import { UserPermission } from '../../core/models/auth.models';

@Directive({
  selector: '[appHasPermission]',
  standalone: true
})
export class HasPermission {
  private authService = inject(AuthService)
  private templateRef = inject(TemplateRef<any>)
  private viewContainer = inject(ViewContainerRef)

  private hasView = false

  @Input() set appHasPermission(permission: UserPermission) {
    const canAccess = this.authService.hasPermission(permission)

    if (canAccess && !this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef)
      this.hasView = true
    } else if (!canAccess && this.hasView) {
      this.viewContainer.clear()
      this.hasView = false
    }
  }
}
