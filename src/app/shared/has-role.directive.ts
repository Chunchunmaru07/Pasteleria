import { Directive, Input, TemplateRef, ViewContainerRef, inject, effect } from '@angular/core';
import { FacturacionService } from '../Facturacion/facturacion.service';

@Directive({
    selector: '[hasRole]',
    standalone: true
})
export class HasRoleDirective {
    private templateRef = inject(TemplateRef<any>);
    private viewContainer = inject(ViewContainerRef);
    private facturacionService = inject(FacturacionService);

    private allowedRoles: string[] = [];

    @Input() set hasRole(roles: string | string[]) {
        this.allowedRoles = Array.isArray(roles) ? roles : [roles];
        this.updateView();
    }

    constructor() {
        effect(() => {
            this.updateView();
        });
    }

    private updateView(): void {
        const currentRole = this.facturacionService.rolUsuario();
        this.viewContainer.clear();

        if (currentRole && this.allowedRoles.includes(currentRole)) {
            this.viewContainer.createEmbeddedView(this.templateRef);
        }
    }
}