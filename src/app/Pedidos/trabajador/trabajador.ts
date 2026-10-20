import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PedidosService, Pedido } from '../pedidos.service';
import { SucursalesService } from '../../Sucursales/sucursales.service';

@Component({
  selector: 'app-trabajador-pedidos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './trabajador.html',
  styleUrl: './trabajador.css',
})
export class Trabajador {
  public pedidosService = inject(PedidosService);
  public sucursalesService = inject(SucursalesService);

  // Sucursal asignada al trabajador actual (por defecto Paseo Durango o la seleccionada en Sucursales)
  readonly sucursalAsignadaId = signal<string>('suc-paseo');

  // Filtros de estado y búsqueda
  readonly filtroEstado = signal<string>('Todos');
  readonly busqueda = signal<string>('');

  // Pedido seleccionado para modal o edición de estado
  readonly pedidoDetalle = signal<Pedido | null>(null);

  // Sucursal actual del trabajador
  readonly sucursalActual = computed(() => {
    const id = this.sucursalAsignadaId();
    return this.sucursalesService.sucursales().find(s => s.id === id) || this.sucursalesService.sucursales()[1];
  });

  // Lista de pedidos de ESTA SUCURSAL exclusivamente
  readonly pedidosTienda = computed(() => {
    const id = this.sucursalAsignadaId();
    let lista = this.pedidosService.pedidosPorSucursal(id);

    const est = this.filtroEstado();
    if (est !== 'Todos') {
      lista = lista.filter(p => p.estado === est);
    }

    const q = this.busqueda().trim().toLowerCase();
    if (q) {
      lista = lista.filter(p =>
        p.id.toLowerCase().includes(q) ||
        p.clienteNombre.toLowerCase().includes(q) ||
        p.items.some(i => i.nombre.toLowerCase().includes(q))
      );
    }

    return lista;
  });

  // Métricas del mostrador de esta tienda
  readonly pendientesCount = computed(() => {
    return this.pedidosService.pedidosPorSucursal(this.sucursalAsignadaId()).filter(p => p.estado === 'Pendiente').length;
  });

  readonly enPreparacionCount = computed(() => {
    return this.pedidosService.pedidosPorSucursal(this.sucursalAsignadaId()).filter(p => ['En Horno', 'Decorando'].includes(p.estado)).length;
  });

  readonly listosCount = computed(() => {
    return this.pedidosService.pedidosPorSucursal(this.sucursalAsignadaId()).filter(p => p.estado === 'Listo').length;
  });

  readonly entregadosHoyCount = computed(() => {
    return this.pedidosService.pedidosPorSucursal(this.sucursalAsignadaId()).filter(p => p.estado === 'Entregado').length;
  });

  cambiarSucursal(sucursalId: string): void {
    this.sucursalAsignadaId.set(sucursalId);
  }

  avanzarEstado(pedido: Pedido, nuevoEstado: Pedido['estado']): void {
    this.pedidosService.actualizarEstado(pedido.id, nuevoEstado);
    if (this.pedidoDetalle() && this.pedidoDetalle()!.id === pedido.id) {
      this.pedidoDetalle.set({ ...this.pedidoDetalle()!, estado: nuevoEstado });
    }
  }

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
