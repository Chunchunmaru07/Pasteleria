import { Injectable, signal, computed } from '@angular/core';

export interface PedidoItem {
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  importe: number;
  notas?: string;
}

export interface Pedido {
  id: string; // Ej. PED-8041
  clienteId: string;
  clienteNombre: string;
  clienteTelefono: string;
  clienteEmail: string;
  sucursalId: string;
  sucursalNombre: string;
  fechaCreacion: string; // ISO
  fechaEntregaEstimada: string;
  items: PedidoItem[];
  subtotal: number;
  costoEnvio: number;
  total: number;
  metodoEntrega: 'Sucursal' | 'Domicilio';
  direccionEntrega?: string;
  metodoPago: 'Efectivo en Entrega' | 'Tarjeta en Línea' | 'Transferencia SPEI';
  estado: 'Pendiente' | 'En Horno' | 'Decorando' | 'Listo' | 'Entregado' | 'Cancelado';
  notasEspeciales?: string;
}

const STORAGE_KEY_PEDIDOS = 'olenka_ezis_pedidos_store';

const PEDIDOS_INICIALES: Pedido[] = [
  // --- CLIENTE 1: Lucía Monroy (cli-101 / cliente@dulcemomento.com) ---
  {
    id: 'PED-8041',
    clienteId: 'cli-101',
    clienteNombre: 'Lucía Monroy Pérez',
    clienteTelefono: '618 123 4567',
    clienteEmail: 'cliente@dulcemomento.com',
    sucursalId: 'suc-centro',
    sucursalNombre: 'Sucursal Matriz Centro Histórico',
    fechaCreacion: '2026-10-20T09:15:00',
    fechaEntregaEstimada: '2026-10-20T16:00:00',
    items: [
      { nombre: 'Pastel Tres Leches Tradicional (10-12 porc.)', cantidad: 1, precioUnitario: 420, importe: 420, notas: 'Dedicatoria: ¡Feliz Cumpleaños Mamá!' },
      { nombre: 'Conchas de Mantequilla Artesanales', cantidad: 6, precioUnitario: 22, importe: 132 }
    ],
    subtotal: 552,
    costoEnvio: 0,
    total: 552,
    metodoEntrega: 'Sucursal',
    metodoPago: 'Tarjeta en Línea',
    estado: 'Decorando',
    notasEspeciales: 'Favor de incluir velitas doradas.'
  },
  {
    id: 'PED-8025',
    clienteId: 'cli-101',
    clienteNombre: 'Lucía Monroy Pérez',
    clienteTelefono: '618 123 4567',
    clienteEmail: 'cliente@dulcemomento.com',
    sucursalId: 'suc-centro',
    sucursalNombre: 'Sucursal Matriz Centro Histórico',
    fechaCreacion: '2026-10-14T11:00:00',
    fechaEntregaEstimada: '2026-10-14T17:30:00',
    items: [
      { nombre: 'Caja de Macarons París (12 pzas)', cantidad: 2, precioUnitario: 320, importe: 640 },
      { nombre: 'Orejas de Hojaldre', cantidad: 4, precioUnitario: 18, importe: 72 }
    ],
    subtotal: 712,
    costoEnvio: 45,
    total: 757,
    metodoEntrega: 'Domicilio',
    direccionEntrega: 'Calle Juárez #314, Zona Centro, Durango, Dgo.',
    metodoPago: 'Tarjeta en Línea',
    estado: 'Entregado',
    notasEspeciales: 'Dejar en recepción con guardia.'
  },

  // --- CLIENTE 2: Fernando Estrada (Paseo Durango) ---
  {
    id: 'PED-8042',
    clienteId: 'cli-102',
    clienteNombre: 'Fernando Estrada Rios',
    clienteTelefono: '618 987 6543',
    clienteEmail: 'fernando.estrada@gmail.com',
    sucursalId: 'suc-paseo',
    sucursalNombre: 'Sucursal Paseo Durango',
    fechaCreacion: '2026-10-20T10:05:00',
    fechaEntregaEstimada: '2026-10-20T14:30:00',
    items: [
      { nombre: 'Pastel Red Velvet Supreme', cantidad: 1, precioUnitario: 480, importe: 480 },
      { nombre: 'Cheesecake Frambuesa Real', cantidad: 1, precioUnitario: 450, importe: 450 }
    ],
    subtotal: 930,
    costoEnvio: 0,
    total: 930,
    metodoEntrega: 'Sucursal',
    metodoPago: 'Efectivo en Entrega',
    estado: 'En Horno',
    notasEspeciales: 'Recoge en vitrina gourmet antes de las 3:00 PM.'
  },

  // --- CLIENTE 3: Mariana Ruiz (Paseo Durango) ---
  {
    id: 'PED-8043',
    clienteId: 'cli-103',
    clienteNombre: 'Mariana Ruiz Ochoa',
    clienteTelefono: '618 456 7890',
    clienteEmail: 'mariana.ruiz@hotmail.com',
    sucursalId: 'suc-paseo',
    sucursalNombre: 'Sucursal Paseo Durango',
    fechaCreacion: '2026-10-20T10:40:00',
    fechaEntregaEstimada: '2026-10-20T18:00:00',
    items: [
      { nombre: 'Pastel de Cajeta de Celaya', cantidad: 1, precioUnitario: 460, importe: 460, notas: 'Nuez extra tostada' }
    ],
    subtotal: 460,
    costoEnvio: 50,
    total: 510,
    metodoEntrega: 'Domicilio',
    direccionEntrega: 'Fracc. Los Remedios #120, Durango, Dgo.',
    metodoPago: 'Transferencia SPEI',
    estado: 'Pendiente',
    notasEspeciales: 'Timbre número 2.'
  },

  // --- CLIENTE 4: Lic. Roberto Garza (Las Alamedas) ---
  {
    id: 'PED-8044',
    clienteId: 'cli-104',
    clienteNombre: 'Lic. Roberto Garza Treviño',
    clienteTelefono: '618 333 2211',
    clienteEmail: 'roberto.garza@despacho.com',
    sucursalId: 'suc-alamedas',
    sucursalNombre: 'Sucursal Las Alamedas & 20 de Noviembre',
    fechaCreacion: '2026-10-20T08:30:00',
    fechaEntregaEstimada: '2026-10-20T12:00:00',
    items: [
      { nombre: 'Conchas de Mantequilla Artesanales', cantidad: 20, precioUnitario: 22, importe: 440 },
      { nombre: 'Pan de Muerto Tradicional', cantidad: 10, precioUnitario: 35, importe: 350 }
    ],
    subtotal: 790,
    costoEnvio: 0,
    total: 790,
    metodoEntrega: 'Sucursal',
    metodoPago: 'Tarjeta en Línea',
    estado: 'Listo',
    notasEspeciales: 'Para junta directiva a las 12:30.'
  },

  // --- CLIENTE 5: Dra. Patricia Solís (Francisco Villa) ---
  {
    id: 'PED-8045',
    clienteId: 'cli-105',
    clienteNombre: 'Dra. Patricia Solís Gómez',
    clienteTelefono: '618 555 8899',
    clienteEmail: 'paty.solis@salud.org',
    sucursalId: 'suc-villa',
    sucursalNombre: 'Sucursal Blvd. Francisco Villa & El Saltito',
    fechaCreacion: '2026-10-20T07:50:00',
    fechaEntregaEstimada: '2026-10-21T15:00:00',
    items: [
      { nombre: 'Pastel Temático XV Años (3 Pisos)', cantidad: 1, precioUnitario: 2800, importe: 2800, notas: 'Temática Floral Rosa Mexicano con toques de oro comestible' }
    ],
    subtotal: 2800,
    costoEnvio: 150,
    total: 2950,
    metodoEntrega: 'Domicilio',
    direccionEntrega: 'Salón de Eventos Las Nubes, Carr. a Mazatlán Km 4.5',
    metodoPago: 'Transferencia SPEI',
    estado: 'Decorando',
    notasEspeciales: 'Montar directamente en mesa principal de postres.'
  },

  // --- CLIENTE 6: Carlos Almonte (Lomas del Parque) ---
  {
    id: 'PED-8046',
    clienteId: 'cli-106',
    clienteNombre: 'Carlos Almonte Nava',
    clienteTelefono: '618 667 8890',
    clienteEmail: 'carlos.almonte@gmail.com',
    sucursalId: 'suc-parque',
    sucursalNombre: 'Sucursal Lomas del Parque & Guadiana',
    fechaCreacion: '2026-10-20T11:15:00',
    fechaEntregaEstimada: '2026-10-20T13:30:00',
    items: [
      { nombre: 'Cesta Picnic Gourmet con Tartas', cantidad: 1, precioUnitario: 390, importe: 390 }
    ],
    subtotal: 390,
    costoEnvio: 0,
    total: 390,
    metodoEntrega: 'Sucursal',
    metodoPago: 'Efectivo en Entrega',
    estado: 'Listo',
    notasEspeciales: 'Para entrega en sombrilla exterior.'
  }
];

@Injectable({
  providedIn: 'root'
})
export class PedidosService {
  /** Lista reactiva de todos los pedidos */
  readonly pedidos = signal<Pedido[]>(this.cargarPedidos());

  // =========================================================================
  // MÉTODOS DE FILTRADO Y CONSULTA
  // =========================================================================

  /**
   * Obtiene pedidos de un cliente específico (por ID o por correo)
   */
  pedidosPorCliente(clienteId?: string, clienteEmail?: string): Pedido[] {
    const todos = this.pedidos();
    if (!clienteId && !clienteEmail) {
      // Si no hay id o email específico, filtrar por el cliente demo predeterminado
      return todos.filter(p => p.clienteId === 'cli-101' || p.clienteEmail.toLowerCase().includes('cliente'));
    }

    return todos.filter(p => {
      const matchId = clienteId && p.clienteId === clienteId;
      const matchEmail = clienteEmail && p.clienteEmail.toLowerCase() === clienteEmail.toLowerCase();
      // Si es un cliente nuevo registrado en la app
      return matchId || matchEmail;
    });
  }

  /**
   * Obtiene pedidos que pertenecen a una sucursal específica (para el trabajador)
   */
  pedidosPorSucursal(sucursalId: string): Pedido[] {
    return this.pedidos().filter(p => p.sucursalId === sucursalId);
  }

  /**
   * Obtiene todos los pedidos de la cadena completa (para el administrador)
   */
  todosLosPedidos(): Pedido[] {
    return this.pedidos();
  }

  // =========================================================================
  // GESTIÓN DE ESTADOS Y NUEVOS PEDIDOS
  // =========================================================================

  /**
   * Actualizar el estado de un pedido (Pendiente -> En Horno -> Decorando -> Listo -> Entregado)
   */
  actualizarEstado(pedidoId: string, nuevoEstado: Pedido['estado']): void {
    this.pedidos.update(lista =>
      lista.map(p => (p.id === pedidoId ? { ...p, estado: nuevoEstado } : p))
    );
    this.persistir();
  }

  /**
   * Crear un nuevo pedido
   */
  crearPedido(nuevo: Omit<Pedido, 'id' | 'fechaCreacion'>): Pedido {
    const id = 'PED-' + (8050 + this.pedidos().length + 1);
    const pedidoCompleto: Pedido = {
      ...nuevo,
      id,
      fechaCreacion: new Date().toISOString()
    };

    this.pedidos.update(lista => [pedidoCompleto, ...lista]);
    this.persistir();
    return pedidoCompleto;
  }

  /**
   * Cancelar un pedido
   */
  cancelarPedido(pedidoId: string): void {
    this.actualizarEstado(pedidoId, 'Cancelado');
  }

  private cargarPedidos(): Pedido[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_PEDIDOS);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return PEDIDOS_INICIALES;
  }

  private persistir(): void {
    try {
      localStorage.setItem(STORAGE_KEY_PEDIDOS, JSON.stringify(this.pedidos()));
    } catch {}
  }

  restablecerPedidos(): void {
    this.pedidos.set(PEDIDOS_INICIALES);
    this.persistir();
  }
}
