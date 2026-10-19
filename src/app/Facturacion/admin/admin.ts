import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { FacturacionService, VentaTicket, FacturaSAT } from '../facturacion.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin.html',
  styleUrl: './admin.css',
})
export class Admin {
  protected readonly facturacionService = inject(FacturacionService);

  /** Filtro de periodo seleccionado para la tabla: 'dia' | 'semana' | 'mes' */
  readonly filtroPeriodo = signal<'dia' | 'semana' | 'mes'>('dia');

  /** Filtro de búsqueda por folio o producto */
  readonly busquedaTicket = signal('');

  /** Pestaña de visualización: 'ventas' (Ventas Totales) | 'facturas' (CFDI SAT Emitidos) */
  readonly pestanaActual = signal<'ventas' | 'facturas'>('ventas');

  /** Factura seleccionada para ver detalles */
  readonly facturaSeleccionada = signal<FacturaSAT | null>(null);

  readonly mensajeToast = signal<string | null>(null);

  /** Ventas filtradas por el periodo seleccionado */
  readonly ventasFiltradasPorPeriodo = computed(() => {
    const periodo = this.filtroPeriodo();
    let lista: VentaTicket[] = [];

    if (periodo === 'dia') {
      lista = this.facturacionService.ventasTiendaDia();
    } else if (periodo === 'semana') {
      lista = this.facturacionService.ventasTiendaSemana();
    } else {
      lista = this.facturacionService.ventasTiendaMes();
    }

    const q = this.busquedaTicket().trim().toLowerCase();
    if (!q) return lista;

    return lista.filter(v =>
      v.folio.toLowerCase().includes(q) ||
      v.trabajadorNombre.toLowerCase().includes(q) ||
      v.items.some(i => i.nombre.toLowerCase().includes(q))
    );
  });

  /** Desglose de ventas por cada trabajador */
  readonly desglosePorTrabajador = computed(() => {
    const ventasMes = this.facturacionService.ventasTiendaMes();
    const mapa = new Map<string, { nombre: string; total: number; tickets: number }>();

    for (const v of ventasMes) {
      const actual = mapa.get(v.trabajadorId) || { nombre: v.trabajadorNombre, total: 0, tickets: 0 };
      actual.total += v.total;
      actual.tickets += 1;
      mapa.set(v.trabajadorId, actual);
    }

    return Array.from(mapa.values());
  });

  cambiarPeriodo(periodo: 'dia' | 'semana' | 'mes'): void {
    this.filtroPeriodo.set(periodo);
  }

  verFacturaModal(factura: FacturaSAT): void {
    this.facturaSeleccionada.set(factura);
  }

  cerrarModalFactura(): void {
    this.facturaSeleccionada.set(null);
  }

  simularVentaTienda(concepto: string, monto: number): void {
    this.facturacionService.registrarVenta(
      [{ nombre: concepto, cantidad: 1, precioUnitario: monto, importe: monto }],
      'trab-2',
      'Carlos Ramos (Turno Vespertino)',
      'Tarjeta de Débito'
    );
    this.mostrarToast(`✓ Venta registrada en tienda: ${concepto} ($${monto} MXN). Métricas actualizadas.`);
  }

  private mostrarToast(msj: string): void {
    this.mensajeToast.set(msj);
    setTimeout(() => {
      this.mensajeToast.set(null);
    }, 3000);
  }
}
