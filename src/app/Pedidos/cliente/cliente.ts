import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PedidosService, Pedido } from '../pedidos.service';
import { FacturacionService } from '../../Facturacion/facturacion.service';

@Component({
  selector: 'app-cliente-pedidos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './cliente.html',
  styleUrl: './cliente.css',
})
export class Cliente {
  public pedidosService = inject(PedidosService);
  public facturacionService = inject(FacturacionService);

  // Filtro de estado
  readonly filtroEstado = signal<string>('Todos');

  // Modal para detalle de pedido
  readonly pedidoDetalle = signal<Pedido | null>(null);

  // Pedidos del cliente actual
  readonly misPedidos = computed(() => {
    const usuario = this.facturacionService.usuarioActual();
    const lista = this.pedidosService.pedidosPorCliente(usuario?.id, usuario?.correo);
    const estado = this.filtroEstado();

    if (estado === 'Todos') return lista;
    return lista.filter(p => p.estado === estado);
  });

  // Métricas del cliente
  readonly pedidosActivosCount = computed(() => {
    const usuario = this.facturacionService.usuarioActual();
    return this.pedidosService
      .pedidosPorCliente(usuario?.id, usuario?.correo)
      .filter(p => ['Pendiente', 'En Horno', 'Decorando', 'Listo'].includes(p.estado)).length;
  });

  readonly pedidosEntregadosCount = computed(() => {
    const usuario = this.facturacionService.usuarioActual();
    return this.pedidosService
      .pedidosPorCliente(usuario?.id, usuario?.correo)
      .filter(p => p.estado === 'Entregado').length;
  });

  verDetalle(pedido: Pedido): void {
    this.pedidoDetalle.set(pedido);
  }

  cerrarDetalle(): void {
    this.pedidoDetalle.set(null);
  }

  getEstadoClass(estado: string): string {
    switch (estado) {
      case 'Pendiente': return 'status-pendiente';
      case 'En Horno': return 'status-horno';
      case 'Decorando': return 'status-decorando';
      case 'Listo': return 'status-listo';
      case 'Entregado': return 'status-entregado';
      case 'Cancelado': return 'status-cancelado';
      default: return '';
    }
  }

  getEstadoIcon(estado: string): string {
    switch (estado) {
      case 'Pendiente': return 'schedule';
      case 'En Horno': return 'local_fire_department';
      case 'Decorando': return 'palette';
      case 'Listo': return 'check_circle';
      case 'Entregado': return 'task_alt';
      case 'Cancelado': return 'cancel';
      default: return 'help';
    }
  }
}
