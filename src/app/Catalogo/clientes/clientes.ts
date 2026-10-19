import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CatalogoService, Producto } from '../catalogo.service';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './clientes.html',
  styleUrl: './clientes.css',
})
export class Clientes {
  protected readonly catalogoService = inject(CatalogoService);

  /** Término de búsqueda */
  readonly busqueda = signal('');

  /** Categoría seleccionada para filtrar */
  readonly categoriaFiltro = signal('Todos');

  /** Modal para ver el resumen de los productos seleccionados */
  readonly modalResumenAbierto = signal(false);

  /** Mensaje de confirmación toast al seleccionar */
  readonly mensajeToast = signal<string | null>(null);

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

  private mostrarToast(mensaje: string): void {
    this.mensajeToast.set(mensaje);
    setTimeout(() => {
      this.mensajeToast.set(null);
    }, 2800);
  }
}
