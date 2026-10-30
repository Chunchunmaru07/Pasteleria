import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CatalogoService, Producto } from '../catalogo.service';

@Component({
  selector: 'app-trabajadores',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './trabajadores.html',
  styleUrl: './trabajadores.css',
})
export class Trabajadores {
  protected readonly catalogoService = inject(CatalogoService);

  readonly busqueda = signal('');
  readonly categoriaFiltro = signal('Todos');
  readonly soloStockBajo = signal(false);
  readonly mensajeToast = signal<string | null>(null);

  /** Valor temporal de stock en edición para cada producto: id -> nuevoStock */
  readonly stockEnEdicion = signal<{ [id: string]: number }>({});

  /** Métricas para trabajadores */
  readonly metricas = computed(() => {
    const todos = this.catalogoService.productos();
    let totalUnidades = 0;
    let stockBajoCount = 0;
    let agotadosCount = 0;

    for (const p of todos) {
      totalUnidades += p.stock;
      if (p.stock === 0) {
        agotadosCount++;
      } else if (p.stock < 5) {
        stockBajoCount++;
      }
    }

    return {
      totalProductos: todos.length,
      totalUnidades,
      stockBajoCount,
      agotadosCount,
    };
  });

  /** Lista de productos filtrados */
  readonly productosFiltrados = computed(() => {
    const termino = this.busqueda().trim().toLowerCase();
    const cat = this.categoriaFiltro();
    const soloBajos = this.soloStockBajo();
    const todos = this.catalogoService.productos();

    return todos.filter((p) => {
      const coincideCat = cat === 'Todos' || p.categoria === cat;
      const coincideTermino =
        !termino ||
        p.nombre.toLowerCase().includes(termino) ||
        p.sabor.toLowerCase().includes(termino) ||
        p.descripcion.toLowerCase().includes(termino);
      const coincideStockBajo = !soloBajos || p.stock < 5;

      return coincideCat && coincideTermino && coincideStockBajo;
    });
  });

  // =========================================================================
  // GESTIÓN DE STOCK - TRABAJADORES Y ADMIN
  // =========================================================================

  /** Ajuste rápido de stock (+1, -1, +5, -5) */
  ajustarStockRapido(producto: Producto, delta: number): void {
    const nuevo = Math.max(0, producto.stock + delta);

    this.catalogoService.actualizarStock(producto.id, nuevo).subscribe({
      next: () => this.mostrarToast(`Stock de "${producto.nombre}" actualizado a ${nuevo} piezas`),
      error: (err) => this.mostrarToast(`⚠ No se pudo actualizar el stock: ${this.catalogoService.mensajeDeError(err)}`),
    });
  }

  /** Valor que se está escribiendo en el input de stock */
  getValorInputStock(prod: Producto): number {
    const editando = this.stockEnEdicion();
    return editando[prod.id] !== undefined ? editando[prod.id] : prod.stock;
  }

  /** Modifica temporalmente el valor del input antes de guardar */
  setValorInputStock(prodId: string, valor: string): void {
    const num = parseInt(valor, 10);
    this.stockEnEdicion.update((prev) => ({
      ...prev,
      [prodId]: isNaN(num) ? 0 : Math.max(0, num),
    }));
  }

  /** Guarda en la base de datos el stock escrito manualmente */
  guardarStockManual(producto: Producto): void {
    const editando = this.stockEnEdicion();
    const valor = editando[producto.id] !== undefined ? editando[producto.id] : producto.stock;
    const finalStock = Math.max(0, Math.floor(valor));

    this.catalogoService.actualizarStock(producto.id, finalStock).subscribe({
      next: () => {
        this.stockEnEdicion.update((prev) => {
          const copia = { ...prev };
          delete copia[producto.id];
          return copia;
        });
        this.mostrarToast(`✓ Stock fijado en ${finalStock} unidades para "${producto.nombre}"`);
      },
      error: (err) => this.mostrarToast(`⚠ No se pudo guardar el stock: ${this.catalogoService.mensajeDeError(err)}`),
    });
  }

  // =========================================================================
  // SELECCIÓN DE PRODUCTOS (IGUAL QUE EL CLIENTE)
  // =========================================================================
  seleccionar(id: string): void {
    this.catalogoService.incrementarSeleccion(id);
  }

  decrementar(id: string): void {
    this.catalogoService.decrementarSeleccion(id);
  }

  getCantidadSeleccionada(id: string): number {
    return this.catalogoService.getCantidadSeleccionada(id);
  }

  private mostrarToast(mensaje: string): void {
    this.mensajeToast.set(mensaje);
    setTimeout(() => {
      this.mensajeToast.set(null);
    }, 2800);
  }
}