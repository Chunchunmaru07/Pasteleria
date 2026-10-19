import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { FacturacionService, VentaTicket } from '../facturacion.service';

@Component({
  selector: 'app-trabajador',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './trabajador.html',
  styleUrl: './trabajador.css',
})
export class Trabajador {
  protected readonly facturacionService = inject(FacturacionService);

  /** Pestaña activa: 'ventas' (Mis Ventas) | 'facturar' (Facturación para Clientes) */
  readonly pestanaActiva = signal<'ventas' | 'facturar'>('ventas');

  /** Filtro temporal para la lista de tickets: 'dia' | 'semana' | 'mes' */
  readonly filtroPeriodo = signal<'dia' | 'semana' | 'mes'>('dia');

  /** Formulario para que el trabajador ayude a facturar a un cliente */
  readonly folioABuscar = signal('TK-1089');
  readonly ticketEncontrado = signal<VentaTicket | null>(null);
  readonly rfcCliente = signal('XAXX010101000');
  readonly razonSocialCliente = signal('PÚBLICO EN GENERAL');
  readonly cpCliente = signal('06700');
  readonly regimenCliente = signal('616 - Sin obligaciones fiscales');
  readonly usoCliente = signal('S01 - Sin efectos fiscales');
  readonly correoCliente = signal('');

  readonly mensajeToast = signal<string | null>(null);

  constructor() {
    this.buscarTicketMostrador();
  }

  cambiarPeriodo(periodo: 'dia' | 'semana' | 'mes'): void {
    this.filtroPeriodo.set(periodo);
  }

  get ticketsFiltrados(): VentaTicket[] {
    const periodo = this.filtroPeriodo();
    if (periodo === 'dia') {
      return this.facturacionService.ventasTrabajadorDia();
    } else if (periodo === 'semana') {
      return this.facturacionService.ventasTrabajadorSemana();
    } else {
      return this.facturacionService.ventasTrabajadorMes();
    }
  }

  // --- Herramienta de Facturación para Clientes en Mostrador ---
  buscarTicketMostrador(): void {
    const t = this.facturacionService.buscarTicketPorFolio(this.folioABuscar());
    this.ticketEncontrado.set(t || null);
  }

  facturarEnMostrador(): void {
    const t = this.ticketEncontrado();
    if (!t) return;

    if (!this.correoCliente() || !this.correoCliente().includes('@')) {
      alert('Ingresa el correo del cliente para enviarle el comprobante.');
      return;
    }

    const fac = this.facturacionService.emitirFactura(t, {
      rfc: this.rfcCliente(),
      razonSocial: this.razonSocialCliente(),
      codigoPostal: this.cpCliente(),
      regimenFiscal: this.regimenCliente(),
      usoCFDI: this.usoCliente(),
      correo: this.correoCliente(),
    });

    this.mostrarToast(`✓ Factura ${fac.folioFactura} generada y enviada a ${fac.correo}`);
    this.buscarTicketMostrador();
  }

  // --- Simulación de Cobro Rápido en Mostrador ---
  registrarVentaRapida(productoNombre: string, precio: number): void {
    this.facturacionService.registrarVenta([
      { nombre: productoNombre, cantidad: 1, precioUnitario: precio, importe: precio }
    ]);
    this.mostrarToast(`✓ Venta registrada: ${productoNombre} ($${precio} MXN)`);
  }

  private mostrarToast(msj: string): void {
    this.mensajeToast.set(msj);
    setTimeout(() => {
      this.mensajeToast.set(null);
    }, 3000);
  }
}
