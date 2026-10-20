import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PedidosService, Pedido } from '../pedidos.service';
import { SucursalesService } from '../../Sucursales/sucursales.service';

@Component({
  selector: 'app-admin-pedidos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin.html',
  styleUrl: './admin.css',
})
export class Admin {
  public pedidosService = inject(PedidosService);
  public sucursalesService = inject(SucursalesService);

  // Filtros globales de administración
  readonly sucursalFiltro = signal<string>('Todas');
  readonly estadoFiltro = signal<string>('Todos');
  readonly busqueda = signal<string>('');

  // Pedido seleccionado para modal
  readonly pedidoDetalle = signal<Pedido | null>(null);

  // Lista de pedidos filtrada de TODAS las tiendas
  readonly pedidosGlobales = computed(() => {
    let lista = this.pedidosService.todosLosPedidos();

    const suc = this.sucursalFiltro();
    if (suc !== 'Todas') {
      lista = lista.filter(p => p.sucursalId === suc);
    }

    const est = this.estadoFiltro();
    if (est !== 'Todos') {
      lista = lista.filter(p => p.estado === est);
    }

    const q = this.busqueda().trim().toLowerCase();
    if (q) {
      lista = lista.filter(p =>
        p.id.toLowerCase().includes(q) ||
        p.clienteNombre.toLowerCase().includes(q) ||
        p.sucursalNombre.toLowerCase().includes(q) ||
        p.items.some(i => i.nombre.toLowerCase().includes(q))
      );
    }

    return lista;
  });

  // Métricas globales para la Dirección General
  readonly totalPedidosCadena = computed(() => this.pedidosService.todosLosPedidos().length);

  readonly ingresosTotalesCadena = computed(() => {
    return this.pedidosService.todosLosPedidos().reduce((acc, p) => acc + p.total, 0);
  });

  readonly pedidosActivosGlobal = computed(() => {
    return this.pedidosService.todosLosPedidos().filter(p => ['Pendiente', 'En Horno', 'Decorando', 'Listo'].includes(p.estado)).length;
  });

  readonly pedidosEntregadosGlobal = computed(() => {
    return this.pedidosService.todosLosPedidos().filter(p => p.estado === 'Entregado').length;
  });

  // Métricas desglosadas por cada sucursal
  readonly metricasPorSucursal = computed(() => {
    const sucursales = this.sucursalesService.sucursales();
    const todos = this.pedidosService.todosLosPedidos();

    return sucursales.map(s => {
      const pedidosSuc = todos.filter(p => p.sucursalId === s.id);
      const totalIngresos = pedidosSuc.reduce((acc, p) => acc + p.total, 0);
      const activos = pedidosSuc.filter(p => ['Pendiente', 'En Horno', 'Decorando', 'Listo'].includes(p.estado)).length;

      return {
        sucursal: s,
        totalPedidos: pedidosSuc.length,
        activos,
        totalIngresos
      };
    });
  });

  verDetalle(pedido: Pedido): void {
    this.pedidoDetalle.set(pedido);
  }

  cerrarDetalle(): void {
    this.pedidoDetalle.set(null);
  }

  actualizarEstadoAdmin(pedido: Pedido, nuevoEstado: Pedido['estado']): void {
    this.pedidosService.actualizarEstado(pedido.id, nuevoEstado);
    if (this.pedidoDetalle() && this.pedidoDetalle()!.id === pedido.id) {
      this.pedidoDetalle.set({ ...this.pedidoDetalle()!, estado: nuevoEstado });
    }
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
