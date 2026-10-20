import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface Producto {
  id: string;
  nombre: string;
  categoria: string;
  descripcion: string;
  sabor: string;
  precio: number;
  stock: number; // Cantidad disponible en inventario
  imagen: string;
  badge?: string; // Ej: "Más Vendido", "Tradicional", "Artesanal"
  porciones?: string; // Ej: "10-12 porciones", "Por pieza"
}

export interface ProductoSeleccionado {
  producto: Producto;
  cantidad: number;
}

@Injectable({
  providedIn: 'root'
})
export class CatalogoService {
  private http = inject(HttpClient);

  // URL del backend Express conectado a MySQL Aiven
  private readonly API_URL = 'http://localhost:3000/api/productos';

  /** Señal reactiva cargada directamente desde la base de datos */
  readonly productos = signal<Producto[]>([]);

  /** Selecciones/Carrito local del cliente */
  readonly seleccion = signal<Map<string, number>>(new Map());

  constructor() {
    // Al instanciar el servicio, cargamos la lista de productos desde la API
    this.cargarProductos();
  }

  /** Consulta los productos en la base de datos MySQL en Aiven */
  cargarProductos(): void {
    this.http.get<Producto[]>(this.API_URL).subscribe({
      next: (datos) => this.productos.set(datos),
      error: (err) => console.error('Error al cargar productos desde la BD:', err)
    });
  }

  // =========================================================================
  // MÉTRICAS Y COMPUTED
  // =========================================================================

  /** Total de piezas seleccionadas */
  readonly totalPiezasSeleccionadas = computed(() => {
    let total = 0;
    for (const cantidad of this.seleccion().values()) {
      total += cantidad;
    }
    return total;
  });

  /** Total en pesos ($ MXN) de la selección */
  readonly totalMontoSeleccionado = computed(() => {
    let monto = 0;
    const mapa = this.seleccion();
    for (const prod of this.productos()) {
      const cant = mapa.get(prod.id) || 0;
      monto += prod.precio * cant;
    }
    return monto;
  });

  /** Categorías únicas disponibles */
  readonly categorias = computed(() => {
    const cats = new Set(this.productos().map(p => p.categoria));
    return ['Todos', ...Array.from(cats)];
  });

  // =========================================================================
  // ACCIONES DE CLIENTE: SELECCIONAR PRODUCTOS (CARRITO LOCAL)
  // =========================================================================

  getCantidadSeleccionada(id: string): number {
    return this.seleccion().get(id) || 0;
  }

  setCantidadSeleccionada(id: string, cantidadDeseada: number): void {
    const prod = this.productos().find(p => p.id === id);
    if (!prod) return;

    const cantFinal = Math.max(0, Math.min(cantidadDeseada, prod.stock));
    this.seleccion.update(mapa => {
      const nuevo = new Map(mapa);
      if (cantFinal <= 0) {
        nuevo.delete(id);
      } else {
        nuevo.set(id, cantFinal);
      }
      return nuevo;
    });
  }

  incrementarSeleccion(id: string): void {
    const actual = this.getCantidadSeleccionada(id);
    this.setCantidadSeleccionada(id, actual + 1);
  }

  decrementarSeleccion(id: string): void {
    const actual = this.getCantidadSeleccionada(id);
    this.setCantidadSeleccionada(id, actual - 1);
  }

  limpiarSeleccion(): void {
    this.seleccion.set(new Map());
  }

  // =========================================================================
  // ACCIONES CON LA BASE DE DATOS (TRABAJADOR Y ADMIN)
  // =========================================================================

  /** Actualiza el stock de un producto en MySQL */
  actualizarStock(id: string, nuevoStock: number): Observable<Producto> {
    const stockNormalizado = Math.max(0, Math.floor(nuevoStock));

    return this.http.patch<Producto>(`${this.API_URL}/${id}/stock`, { stock: stockNormalizado }).pipe(
      tap((prodActualizado) => {
        this.productos.update(lista =>
          lista.map(p => p.id === id ? prodActualizado : p)
        );
        if (this.getCantidadSeleccionada(id) > stockNormalizado) {
          this.setCantidadSeleccionada(id, stockNormalizado);
        }
      })
    );
  }

  /** Actualiza el precio de un producto en MySQL */
  actualizarPrecio(id: string, nuevoPrecio: number): Observable<Producto> {
    const precioNormalizado = Math.max(0, Math.round(nuevoPrecio * 100) / 100);

    return this.http.patch<Producto>(`${this.API_URL}/${id}/precio`, { precio: precioNormalizado }).pipe(
      tap((prodActualizado) => {
        this.productos.update(lista =>
          lista.map(p => p.id === id ? prodActualizado : p)
        );
      })
    );
  }

  /** Elimina un producto de la base de datos */
  eliminarProducto(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`).pipe(
      tap(() => {
        this.productos.update(lista => lista.filter(p => p.id !== id));
        this.seleccion.update(mapa => {
          const nuevo = new Map(mapa);
          nuevo.delete(id);
          return nuevo;
        });
      })
    );
  }

  /** Registra un nuevo producto en MySQL */
  agregarProducto(productoNuevo: Omit<Producto, 'id'>): Observable<Producto> {
    return this.http.post<Producto>(this.API_URL, productoNuevo).pipe(
      tap((productoCreado) => {
        this.productos.update(lista => [productoCreado, ...lista]);
      })
    );
  }

  /** Restablece la selección y recarga los productos actualizados desde MySQL en Aiven */
  restablecerValoresPorDefecto(): void {
    this.limpiarSeleccion();
    this.cargarProductos();
  }
}