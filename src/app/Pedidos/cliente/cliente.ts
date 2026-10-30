import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CatalogoService, Producto } from '../../Catalogo/catalogo.service';
import { PedidosService, Pedido, PedidoItem } from '../pedidos.service';
import { FacturacionService } from '../../Facturacion/facturacion.service';
import { SucursalesService } from '../../Sucursales/sucursales.service';

@Component({
  selector: 'app-cliente-pedidos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './cliente.html',
  styleUrl: './cliente.css',
})
export class Clientes {
  protected readonly catalogoService = inject(CatalogoService);
  protected readonly pedidosService = inject(PedidosService);
  protected readonly facturacionService = inject(FacturacionService);
  protected readonly sucursalesService = inject(SucursalesService);
  private readonly router = inject(Router);

  /** Costo fijo de envío a domicilio (cámbialo a tu tarifa real) */
  readonly COSTO_ENVIO_DOMICILIO = 45;

  /** Término de búsqueda */
  readonly busqueda = signal('');

  /** Categoría seleccionada para filtrar */
  readonly categoriaFiltro = signal('Todos');

  /** Modal para ver el resumen de los productos seleccionados */
  readonly modalResumenAbierto = signal(false);

  /** Mensaje de confirmación toast */
  readonly mensajeToast = signal<string | null>(null);

  // ----- Datos del pedido (se llenan en el modal) -----
  readonly sucursalElegida = signal('');
  readonly metodoEntrega = signal<'Sucursal' | 'Domicilio'>('Sucursal');
  readonly direccionEntrega = signal('');
  readonly metodoPago = signal<Pedido['metodoPago']>('Efectivo en Entrega');
  readonly notasEspeciales = signal('');
  readonly enviando = signal(false);

  /** Sucursal elegida (si no eligió ninguna, la primera de la lista) */
  readonly sucursalActual = computed(() => {
    const lista = this.sucursalesService.sucursales();
    return lista.find((s) => s.id === this.sucursalElegida()) ?? lista[0];
  });

  readonly costoEnvio = computed(() =>
    this.metodoEntrega() === 'Domicilio' ? this.COSTO_ENVIO_DOMICILIO : 0
  );

  readonly totalConEnvio = computed(
    () => Math.round((this.catalogoService.totalMontoSeleccionado() + this.costoEnvio()) * 100) / 100
  );

  /** Lista de productos filtrados */
  readonly productosFiltrados = computed(() => {
    const termino = this.busqueda().trim().toLowerCase();
    const cat = this.categoriaFiltro();
    const todos = this.catalogoService.productos();

    return todos.filter((p) => {
      const coincideCat = cat === 'Todos' || p.categoria === cat;
      const coincideTermino =
        !termino ||
        p.nombre.toLowerCase().includes(termino) ||
        p.sabor.toLowerCase().includes(termino) ||
        p.descripcion.toLowerCase().includes(termino);
      return coincideCat && coincideTermino;
    });
  });

  /** Productos seleccionados actualmente */
  readonly productosEnSeleccion = computed(() => {
    const mapa = this.catalogoService.seleccion();
    const resultado: { producto: Producto; cantidad: number; subtotal: number }[] = [];

    for (const prod of this.catalogoService.productos()) {
      const cant = mapa.get(prod.id) || 0;
      if (cant > 0) {
        resultado.push({
          producto: prod,
          cantidad: cant,
          subtotal: prod.precio * cant,
        });
      }
    }
    return resultado;
  });

  seleccionarProducto(producto: Producto): void {
    if (producto.stock <= 0) return;
    this.catalogoService.incrementarSeleccion(producto.id);
    this.mostrarToast(`¡Agregaste 1 "${producto.nombre}" a tu selección!`);
  }

  incrementar(id: string): void {
    this.catalogoService.incrementarSeleccion(id);
  }

  decrementar(id: string): void {
    this.catalogoService.decrementarSeleccion(id);
  }

  obtenerCantidad(id: string): number {
    return this.catalogoService.getCantidadSeleccionada(id);
  }

  abrirResumen(): void {
    if (this.catalogoService.totalPiezasSeleccionadas() > 0) {
      this.modalResumenAbierto.set(true);
    }
  }

  cerrarResumen(): void {
    this.modalResumenAbierto.set(false);
  }

  vaciarSeleccion(): void {
    this.catalogoService.limpiarSeleccion();
    this.cerrarResumen();
    this.mostrarToast('Se ha vaciado tu selección');
  }

  // =========================================================================
  // CONFIRMAR PEDIDO → se guarda en MySQL (tablas pedidos y lista_productos)
  // =========================================================================
  confirmarPedido(): void {
    if (this.enviando()) return;

    const usuario: any = this.facturacionService.usuarioActual();
    if (!usuario) {
      this.mostrarToast('⚠ Inicia sesión para hacer tu pedido.');
      return;
    }

    const sucursal = this.sucursalActual();
    if (!sucursal) {
      this.mostrarToast('⚠ Elige una sucursal.');
      return;
    }

    if (this.metodoEntrega() === 'Domicilio' && !this.direccionEntrega().trim()) {
      this.mostrarToast('⚠ Escribe la dirección de entrega.');
      return;
    }

    const items: PedidoItem[] = this.productosEnSeleccion().map((i) => ({
      productoId: i.producto.id,
      nombre: i.producto.nombre,
      cantidad: i.cantidad,
      precioUnitario: i.producto.precio,
      importe: i.subtotal,
    }));

    if (items.length === 0) return;

    this.enviando.set(true);

    this.pedidosService
      .crearPedido({
        clienteId: String(usuario.id),
        clienteNombre: usuario.nombre || usuario.correo || '',
        clienteTelefono: '',
        clienteEmail: usuario.correo || '',
        sucursalId: sucursal.id,
        sucursalNombre: (sucursal as any).nombre,
        fechaEntregaEstimada: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        items,
        subtotal: this.catalogoService.totalMontoSeleccionado(),
        costoEnvio: this.costoEnvio(),
        total: this.totalConEnvio(),
        metodoEntrega: this.metodoEntrega(),
        direccionEntrega: this.metodoEntrega() === 'Domicilio' ? this.direccionEntrega().trim() : undefined,
        metodoPago: this.metodoPago(),
        estado: 'Pendiente',
        notasEspeciales: this.notasEspeciales().trim() || undefined,
      })
      .subscribe({
        next: (pedido) => {
          this.enviando.set(false);
          this.catalogoService.limpiarSeleccion();
          this.catalogoService.cargarProductos(); // refresca el stock
          this.notasEspeciales.set('');
          this.direccionEntrega.set('');
          this.cerrarResumen();
          this.mostrarToast(`✓ ¡Pedido ${pedido.id} registrado!`);
          this.router.navigate(['/mis-pedidos']);
        },
        error: (err) => {
          this.enviando.set(false);
          this.mostrarToast(`⚠ No se pudo registrar el pedido: ${this.catalogoService.mensajeDeError(err)}`);
        },
      });
  }

  private mostrarToast(mensaje: string): void {
    this.mensajeToast.set(mensaje);
    setTimeout(() => {
      this.mensajeToast.set(null);
    }, 3200);
  }
}