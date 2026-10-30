import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { FacturacionService } from '../Facturacion/facturacion.service';
import { HasRoleDirective } from '../shared/has-role.directive'; // <-- 1. Importamos tu directiva

@Component({
  selector: 'app-encabezado',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, HasRoleDirective], // <-- 2. La agregamos a los imports
  templateUrl: './encabezado.html',
  styleUrl: './encabezado.css',
})
export class Encabezado {
  public facturacionService = inject(FacturacionService);

  /** Estado reactivo para el menú móvil */
  readonly isMobileMenuOpen = signal(false);

  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update((open) => !open);
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
  }
}