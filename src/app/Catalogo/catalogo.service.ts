import { Injectable, signal, computed } from '@angular/core';

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

const STORAGE_KEY = 'olenka_ezis_catalogo_productos';

const PRODUCTOS_INICIALES: Producto[] = [
  {
    id: 'prod-1',
    nombre: 'Pastel Tres Leches Tradicional',
    categoria: 'Pasteles Tradicionales',
    descripcion: 'Bizcocho bañado en tres leches con canela, cubierto de crema chantilly suave y duraznos en almíbar.',
    sabor: 'Tres Leches con Canela y Frutas',
    precio: 420,
    stock: 8,
    imagen: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80',
    badge: 'Favorito',
    porciones: '10-12 porciones'
  },
  {
    id: 'prod-2',
    nombre: 'Conchas de Mantequilla Artesanales',
    categoria: 'Pan Dulce Mexicano',
    descripcion: 'Masa esponjosa con mantequilla pura y costra crujiente de azúcar sabor vainilla natural y chocolate.',
    sabor: 'Vainilla de Papantla y Chocolate',
    precio: 22,
    stock: 35,
    imagen: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80',
    badge: 'Tradicional',
    porciones: 'Por pieza'
  },
  {
    id: 'prod-3',
    nombre: 'Pastel de Cajeta de Celaya',
    categoria: 'Pasteles Tradicionales',
    descripcion: 'Capas de pan de nuez bañado en cajeta quemada de leche de cabra y lluvia de nuez pecana tostada.',
    sabor: 'Cajeta Quemada & Nuez',
    precio: 460,
    stock: 6,
    imagen: 'https://images.unsplash.com/photo-1535141192574-5d4897c13136?auto=format&fit=crop&w=600&q=80',
    badge: 'Especialidad',
    porciones: '12 porciones'
  },
  {
    id: 'prod-4',
    nombre: 'Pan de Muerto Tradicional',
    categoria: 'Pan Dulce Mexicano',
    descripcion: 'Receta familiar con notas de flor de azahar, ralladura de naranja fresca y mantequilla dorada.',
    sabor: 'Flor de Azahar & Naranja',
    precio: 35,
    stock: 20,
    imagen: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=600&q=80',
    badge: 'Artesanal',
    porciones: 'Por pieza'
  },
  {
    id: 'prod-5',
    nombre: 'Cheesecake de Frambuesa Real',
    categoria: 'Tartas & Cheesecakes',
    descripcion: 'Costra de galleta canela con relleno cremoso horneado a baño maría y coulis de frambuesas frescas.',
    sabor: 'Queso Crema & Frambuesa',
    precio: 450,
    stock: 5,
    imagen: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=600&q=80',
    badge: 'Gourmet',
    porciones: '8-10 porciones'
  },
  {
    id: 'prod-6',
    nombre: 'Pastel Selva Negra de Cacao Oaxaqueño',
    categoria: 'Pasteles Tradicionales',
    descripcion: 'Bizcocho húmedo de cacao con cerezas maceradas, chantilly ligera y virutas de chocolate amargo.',
    sabor: 'Cacao 70% & Cerezas',
    precio: 490,
    stock: 4,
    imagen: 'https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?auto=format&fit=crop&w=600&q=80',
    badge: 'Más Vendido',
    porciones: '10-12 porciones'
  },
  {
    id: 'prod-7',
    nombre: 'Orejas de Hojaldre Caramelizadas',
    categoria: 'Pan Dulce Mexicano',
    descripcion: 'Hojaldre elaborado con doble vuelta francesa y caramelizado con azúcar morena y toque de canela.',
    sabor: 'Hojaldre & Mantequilla',
    precio: 18,
    stock: 28,
    imagen: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=600&q=80',
    badge: 'Clásico',
    porciones: 'Por pieza'
  },
  {
    id: 'prod-8',
    nombre: 'Caja de Macarons Artesanales (12 pzas)',
    categoria: 'Repostería Internacional',
    descripcion: 'Bocados crujientes con rellenos de maracuyá, cajeta con sal marina, chocolate oaxaqueño y pistacho.',
    sabor: 'Surtido Fino Mexicano & Francés',
    precio: 320,
    stock: 12,
    imagen: 'https://images.unsplash.com/photo-1569864321390-dc893049b49b?auto=format&fit=crop&w=600&q=80',
    badge: 'Boutique',
    porciones: '12 piezas'
  }
];

@Injectable({
  providedIn: 'root'
})
export class CatalogoService {
  /** Señal reactiva con todos los productos del catálogo */
  readonly productos = signal<Producto[]>(this.cargarProductosIniciales());

  /** Señal con los productos seleccionados por el cliente o usuario actual */
  readonly seleccion = signal<Map<string, number>>(new Map());

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

  private cargarProductosIniciales(): Producto[] {
    try {
      const guardados = localStorage.getItem(STORAGE_KEY);
      if (guardados) {
        const parsed = JSON.parse(guardados);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Si ocurre un error de lectura, usamos los iniciales
    }
    return PRODUCTOS_INICIALES;
  }

  private persistir(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.productos()));
    } catch {
      // Ignore storage errors
    }
  }

  // =========================================================================
  // ACCIONES DE CLIENTE: SELECCIONAR PRODUCTOS
  // =========================================================================

  /** Obtiene la cantidad seleccionada para un producto específico */
  getCantidadSeleccionada(id: string): number {
    return this.seleccion().get(id) || 0;
  }

  /** Modifica la cantidad que el cliente desea seleccionar (respetando el stock disponible) */
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

  /** Incrementa en 1 la selección si hay stock disponible */
  incrementarSeleccion(id: string): void {
    const actual = this.getCantidadSeleccionada(id);
    this.setCantidadSeleccionada(id, actual + 1);
  }

  /** Decrementa en 1 la selección */
  decrementarSeleccion(id: string): void {
    const actual = this.getCantidadSeleccionada(id);
    this.setCantidadSeleccionada(id, actual - 1);
  }

  /** Limpia toda la selección */
  limpiarSeleccion(): void {
    this.seleccion.set(new Map());
  }

  // =========================================================================
  // ACCIONES DE TRABAJADOR Y ADMIN: EDITAR CANTIDAD DISPONIBLE (STOCK)
  // =========================================================================

  /** Permite a trabajadores y administradores editar el stock disponible */
  actualizarStock(id: string, nuevoStock: number): boolean {
    const stockNormalizado = Math.max(0, Math.floor(nuevoStock));
    let actualizado = false;

    this.productos.update(lista => {
      return lista.map(p => {
        if (p.id === id) {
          actualizado = true;
          return { ...p, stock: stockNormalizado };
        }
        return p;
      });
    });

    if (actualizado) {
      // Ajustar la selección si excede el nuevo stock
      const cantSel = this.getCantidadSeleccionada(id);
      if (cantSel > stockNormalizado) {
        this.setCantidadSeleccionada(id, stockNormalizado);
      }
      this.persistir();
    }
    return actualizado;
  }

  // =========================================================================
  // ACCIONES EXCLUSIVAS DE ADMIN: PRECIOS, AGREGAR Y QUITAR PRODUCTOS
  // =========================================================================

  /** Permite al administrador cambiar el precio de un producto */
  actualizarPrecio(id: string, nuevoPrecio: number): boolean {
    if (nuevoPrecio < 0) return false;
    let modificado = false;

    this.productos.update(lista => {
      return lista.map(p => {
        if (p.id === id) {
          modificado = true;
          return { ...p, precio: Math.round(nuevoPrecio * 100) / 100 };
        }
        return p;
      });
    });

    if (modificado) {
      this.persistir();
    }
    return modificado;
  }

  /** Permite al administrador quitar (eliminar) un producto del catálogo */
  eliminarProducto(id: string): boolean {
    let eliminado = false;
    this.productos.update(lista => {
      const filtrada = lista.filter(p => p.id !== id);
      if (filtrada.length !== lista.length) {
        eliminado = true;
      }
      return filtrada;
    });

    if (eliminado) {
      this.seleccion.update(mapa => {
        const nuevo = new Map(mapa);
        nuevo.delete(id);
        return nuevo;
      });
      this.persistir();
    }
    return eliminado;
  }

  /** Permite al administrador agregar un nuevo producto */
  agregarProducto(productoNuevo: Omit<Producto, 'id'>): Producto {
    const id = 'prod-' + Date.now();
    const productoCreado: Producto = {
      ...productoNuevo,
      id,
      precio: Math.max(0, productoNuevo.precio),
      stock: Math.max(0, Math.floor(productoNuevo.stock))
    };

    this.productos.update(lista => [productoCreado, ...lista]);
    this.persistir();
    return productoCreado;
  }

  /** Restablece los productos por defecto de fábrica */
  restablecerValoresPorDefecto(): void {
    this.productos.set(PRODUCTOS_INICIALES);
    this.seleccion.set(new Map());
    this.persistir();
  }
}
