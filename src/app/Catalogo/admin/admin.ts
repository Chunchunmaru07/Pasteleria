import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CatalogoService, Producto } from '../catalogo.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin.html',
  styleUrl: './admin.css',
})
export class Admins {
  protected readonly catalogoService = inject(CatalogoService);

  readonly busqueda = signal('');
  readonly categoriaFiltro = signal('Todos');
  readonly mensajeToast = signal<string | null>(null);

  /** Evita doble clic mientras se guarda un nuevo producto */
  readonly guardando = signal(false);

  /** Producto seleccionado para confirmar eliminación */
  readonly productoAEliminar = signal<Producto | null>(null);

  /** Modal para agregar nuevo producto */
  readonly modalAgregarAbierto = signal(false);

  /** Formulario de nuevo producto */
  readonly formNuevo = signal({
    nombre: '',
    categoria: 'Pasteles Tradicionales',
    descripcion: '',
    sabor: '',
    precio: 350,
    stock: 12,
    imagen: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80',
    badge: 'Nuevo',
    porciones: '10-12 porciones',
  });

  /** Valores temporales de precio en edición: id -> precio */
  readonly precioEnEdicion = signal<{ [id: string]: number }>({});

  /** Valores temporales de stock en edición: id -> stock */
  readonly stockEnEdicion = signal<{ [id: string]: number }>({});

  /** Imágenes sugeridas de repostería para el modal de nuevo producto */
  readonly imagenesSugeridas = [
    { label: 'Pastel Fresa & Crema', url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80' },
    { label: 'Pan Dulce Horneado', url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80' },
    { label: 'Tarta de Chocolate', url: 'https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?auto=format&fit=crop&w=600&q=80' },
    { label: 'Pastel de Bodas / Fiesta', url: 'https://images.unsplash.com/photo-1535141192574-5d4897c13136?auto=format&fit=crop&w=600&q=80' },
    { label: 'Cheesecake Frambuesa', url: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=600&q=80' },
    { label: 'Macarons Parisinos', url: 'https://images.unsplash.com/photo-1569864321390-dc893049b49b?auto=format&fit=crop&w=600&q=80' },
  ];

  /** Productos filtrados */
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
        p.categoria.toLowerCase().includes(termino);
      return coincideCat && coincideTermino;
    });
  });

  // =========================================================================
  // GESTIÓN DE PRECIO - EXCLUSIVO ADMINISTRADOR
  // =========================================================================

  getValorInputPrecio(prod: Producto): number {
    const editando = this.precioEnEdicion();
    return editando[prod.id] !== undefined ? editando[prod.id] : prod.precio;
  }

  setValorInputPrecio(prodId: string, valor: string): void {
    const num = parseFloat(valor);
    this.precioEnEdicion.update((prev) => ({
      ...prev,
      [prodId]: isNaN(num) ? 0 : Math.max(0, num),
    }));
  }

  guardarPrecioManual(producto: Producto): void {
    const editando = this.precioEnEdicion();
    const valor = editando[producto.id] !== undefined ? editando[producto.id] : producto.precio;
    const finalPrecio = Math.max(0, Math.round(valor * 100) / 100);

    this.catalogoService.actualizarPrecio(producto.id, finalPrecio).subscribe({
      next: () => {
        this.precioEnEdicion.update((prev) => {
          const copia = { ...prev };
          delete copia[producto.id];
          return copia;
        });
        this.mostrarToast(`✓ Precio de "${producto.nombre}" actualizado a $${finalPrecio} MXN`);
      },
      error: (err) => this.mostrarToast(`⚠ No se pudo cambiar el precio: ${this.catalogoService.mensajeDeError(err)}`),
    });
  }

  // =========================================================================
  // GESTIÓN DE STOCK
  // =========================================================================

  ajustarStock(producto: Producto, delta: number): void {
    const nuevo = Math.max(0, producto.stock + delta);

    this.catalogoService.actualizarStock(producto.id, nuevo).subscribe({
      next: () => this.mostrarToast(`Stock de "${producto.nombre}" actualizado a ${nuevo} piezas`),
      error: (err) => this.mostrarToast(`⚠ No se pudo actualizar el stock: ${this.catalogoService.mensajeDeError(err)}`),
    });
  }

  getValorInputStock(prod: Producto): number {
    const editando = this.stockEnEdicion();
    return editando[prod.id] !== undefined ? editando[prod.id] : prod.stock;
  }

  setValorInputStock(prodId: string, valor: string): void {
    const num = parseInt(valor, 10);
    this.stockEnEdicion.update((prev) => ({
      ...prev,
      [prodId]: isNaN(num) ? 0 : Math.max(0, num),
    }));
  }

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
        this.mostrarToast(`✓ Stock fijado en ${finalStock} unidades`);
      },
      error: (err) => this.mostrarToast(`⚠ No se pudo guardar el stock: ${this.catalogoService.mensajeDeError(err)}`),
    });
  }

  // =========================================================================
  // QUITAR PRODUCTOS - EXCLUSIVO ADMINISTRADOR
  // =========================================================================

  abrirConfirmacionEliminar(producto: Producto): void {
    this.productoAEliminar.set(producto);
  }

  cancelarEliminar(): void {
    this.productoAEliminar.set(null);
  }

  ejecutarEliminar(): void {
    const prod = this.productoAEliminar();
    if (!prod) return;

    this.catalogoService.eliminarProducto(prod.id).subscribe({
      next: () => {
        this.mostrarToast(`🗑 Se ha quitado "${prod.nombre}" del catálogo`);
        this.productoAEliminar.set(null);
      },
      error: (err) => {
        this.mostrarToast(`⚠ No se pudo eliminar: ${this.catalogoService.mensajeDeError(err)}`);
        this.productoAEliminar.set(null);
      },
    });
  }

  // =========================================================================
  // AGREGAR PRODUCTOS - EXCLUSIVO ADMINISTRADOR
  // =========================================================================

  abrirModalAgregar(): void {
    this.formNuevo.set({
      nombre: '',
      categoria: 'Pasteles Tradicionales',
      descripcion: '',
      sabor: '',
      precio: 350,
      stock: 10,
      imagen: this.imagenesSugeridas[0].url,
      badge: 'Nuevo',
      porciones: '10-12 porciones',
    });
    this.modalAgregarAbierto.set(true);
  }

  cerrarModalAgregar(): void {
    this.modalAgregarAbierto.set(false);
  }

  seleccionarImagenSugerida(url: string): void {
    this.formNuevo.update((f) => ({ ...f, imagen: url }));
  }

  guardarNuevoProducto(): void {
    const f = this.formNuevo();
    if (!f.nombre.trim()) {
      this.mostrarToast('⚠ Por favor escribe el nombre del producto.');
      return;
    }
    if (this.guardando()) return;

    this.guardando.set(true);

    this.catalogoService
      .agregarProducto({
        nombre: f.nombre.trim(),
        categoria: f.categoria,
        descripcion: f.descripcion.trim() || 'Elaborado artesanalmente con recetas tradicionales.',
        sabor: f.sabor.trim() || 'Sabor tradicional',
        precio: Math.max(0, Number(f.precio) || 0),
        stock: Math.max(0, Math.floor(Number(f.stock) || 0)),
        imagen: f.imagen.trim() || this.imagenesSugeridas[0].url,
        badge: f.badge.trim() || null,
        porciones: f.porciones.trim() || 'Porción individual',
      })
      .subscribe({
        next: () => {
          this.guardando.set(false);
          this.cerrarModalAgregar();
          this.mostrarToast(`✨ ¡Producto "${f.nombre}" agregado con éxito al catálogo!`);
        },
        error: (err) => {
          this.guardando.set(false);
          this.mostrarToast(`⚠ No se pudo agregar el producto: ${this.catalogoService.mensajeDeError(err)}`);
        },
      });
  }

  /** Recarga el catálogo desde la base de datos y vacía la selección */
  restablecerCatalogo(): void {
    if (confirm('¿Deseas recargar el catálogo desde la base de datos?')) {
      this.catalogoService.restablecerValoresPorDefecto();
      this.mostrarToast('Catálogo recargado desde la base de datos');
    }
  }

  // Selección (igual que cliente)
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
    }, 3000);
  }
}