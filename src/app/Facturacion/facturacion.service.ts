import { Injectable, signal, computed } from '@angular/core';

export interface VentaItem {
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  importe: number;
}

export interface VentaTicket {
  folio: string; // Ej: TK-1042
  fecha: string; // YYYY-MM-DDTHH:mm:ss
  trabajadorId: string; // 'trab-1' | 'trab-2'
  trabajadorNombre: string;
  items: VentaItem[];
  subtotal: number;
  iva: number;
  total: number;
  facturado: boolean;
  uuidFactura?: string;
  metodoPago: string; // 'Efectivo', 'Tarjeta de Débito', 'Transferencia'
}

export interface FacturaSAT {
  folioFactura: string; // Ej: FAC-2026-0842
  folioTicket: string;
  uuidSAT: string; // Folio fiscal UUID SAT
  rfcReceptor: string;
  razonSocial: string;
  codigoPostal: string;
  regimenFiscal: string;
  usoCFDI: string;
  correo: string;
  fechaEmision: string;
  subtotal: number;
  iva: number;
  total: number;
  items: VentaItem[];
}

const STORAGE_VENTAS_KEY = 'olenka_ezis_ventas_store';
const STORAGE_FACTURAS_KEY = 'olenka_ezis_facturas_store';

// Generar ventas iniciales realistas para Día, Semana y Mes
const VENTAS_INICIALES: VentaTicket[] = [
  // --- VENTAS DE HOY (13 de Octubre 2026) ---
  {
    folio: 'TK-1088',
    fecha: '2026-10-13T10:15:00',
    trabajadorId: 'trab-1',
    trabajadorNombre: 'María González (Turno Actual)',
    items: [
      { nombre: 'Pastel Tres Leches Tradicional', cantidad: 1, precioUnitario: 420, importe: 420 },
      { nombre: 'Conchas de Mantequilla Artesanales', cantidad: 4, precioUnitario: 22, importe: 88 }
    ],
    subtotal: 437.93,
    iva: 70.07,
    total: 508,
    facturado: true,
    uuidFactura: '4A8F9B2C-7E1D-4C92-A528-9842FBC91024',
    metodoPago: 'Tarjeta de Débito'
  },
  {
    folio: 'TK-1089',
    fecha: '2026-10-13T11:30:00',
    trabajadorId: 'trab-1',
    trabajadorNombre: 'María González (Turno Actual)',
    items: [
      { nombre: 'Pastel de Cajeta de Celaya', cantidad: 1, precioUnitario: 460, importe: 460 },
      { nombre: 'Orejas de Hojaldre', cantidad: 6, precioUnitario: 18, importe: 108 }
    ],
    subtotal: 489.65,
    iva: 78.35,
    total: 568,
    facturado: false,
    metodoPago: 'Efectivo'
  },
  {
    folio: 'TK-1090',
    fecha: '2026-10-13T12:45:00',
    trabajadorId: 'trab-2',
    trabajadorNombre: 'Carlos Ramos (Mostrador 2)',
    items: [
      { nombre: 'Cheesecake de Frambuesa Real', cantidad: 1, precioUnitario: 450, importe: 450 },
      { nombre: 'Caja Macarons París', cantidad: 1, precioUnitario: 320, importe: 320 }
    ],
    subtotal: 663.79,
    iva: 106.21,
    total: 770,
    facturado: true,
    uuidFactura: '7F3E2B1A-9D4C-4B81-8124-C9842FB91089',
    metodoPago: 'Tarjeta de Crédito'
  },
  {
    folio: 'TK-1091',
    fecha: '2026-10-13T14:10:00',
    trabajadorId: 'trab-1',
    trabajadorNombre: 'María González (Turno Actual)',
    items: [
      { nombre: 'Pan de Muerto Tradicional', cantidad: 8, precioUnitario: 35, importe: 280 }
    ],
    subtotal: 241.38,
    iva: 38.62,
    total: 280,
    facturado: false,
    metodoPago: 'Efectivo'
  },
  {
    folio: 'TK-1092',
    fecha: '2026-10-13T15:20:00',
    trabajadorId: 'trab-2',
    trabajadorNombre: 'Carlos Ramos (Mostrador 2)',
    items: [
      { nombre: 'Pastel Selva Negra de Cacao', cantidad: 1, precioUnitario: 490, importe: 490 },
      { nombre: 'Conchas de Mantequilla', cantidad: 5, precioUnitario: 22, importe: 110 }
    ],
    subtotal: 517.24,
    iva: 82.76,
    total: 600,
    facturado: false,
    metodoPago: 'Transferencia'
  },

  // --- VENTAS DE ESTA SEMANA (Octubre 11 a 12 de 2026) ---
  {
    folio: 'TK-1075',
    fecha: '2026-10-12T09:40:00',
    trabajadorId: 'trab-1',
    trabajadorNombre: 'María González (Turno Actual)',
    items: [
      { nombre: 'Pastel Tres Leches Tradicional', cantidad: 2, precioUnitario: 420, importe: 840 },
      { nombre: 'Caja de Macarons', cantidad: 2, precioUnitario: 320, importe: 640 }
    ],
    subtotal: 1275.86,
    iva: 204.14,
    total: 1480,
    facturado: true,
    uuidFactura: 'B8291A7C-5D2B-4E90-A912-3482FBC81920',
    metodoPago: 'Tarjeta de Débito'
  },
  {
    folio: 'TK-1076',
    fecha: '2026-10-12T16:15:00',
    trabajadorId: 'trab-2',
    trabajadorNombre: 'Carlos Ramos (Mostrador 2)',
    items: [
      { nombre: 'Pastel de Cajeta', cantidad: 2, precioUnitario: 460, importe: 920 },
      { nombre: 'Pan de Muerto Tradicional', cantidad: 10, precioUnitario: 35, importe: 350 }
    ],
    subtotal: 1094.83,
    iva: 175.17,
    total: 1270,
    facturado: false,
    metodoPago: 'Efectivo'
  },
  {
    folio: 'TK-1060',
    fecha: '2026-10-11T11:00:00',
    trabajadorId: 'trab-1',
    trabajadorNombre: 'María González (Turno Actual)',
    items: [
      { nombre: 'Pastel Selva Negra Oaxaqueño', cantidad: 2, precioUnitario: 490, importe: 980 },
      { nombre: 'Cheesecake Frambuesa', cantidad: 1, precioUnitario: 450, importe: 450 }
    ],
    subtotal: 1232.76,
    iva: 197.24,
    total: 1430,
    facturado: true,
    uuidFactura: '3C9182AB-4E1D-4B72-9182-482FBC919241',
    metodoPago: 'Tarjeta de Crédito'
  },
  {
    folio: 'TK-1061',
    fecha: '2026-10-11T17:30:00',
    trabajadorId: 'trab-2',
    trabajadorNombre: 'Carlos Ramos (Mostrador 2)',
    items: [
      { nombre: 'Conchas de Mantequilla', cantidad: 20, precioUnitario: 22, importe: 440 },
      { nombre: 'Orejas de Hojaldre', cantidad: 15, precioUnitario: 18, importe: 270 }
    ],
    subtotal: 612.07,
    iva: 97.93,
    total: 710,
    facturado: false,
    metodoPago: 'Efectivo'
  },

  // --- VENTAS ANTERIORES DE ESTE MES (Octubre 1 a 10 de 2026) ---
  {
    folio: 'TK-1010',
    fecha: '2026-10-08T10:00:00',
    trabajadorId: 'trab-1',
    trabajadorNombre: 'María González (Turno Actual)',
    items: [
      { nombre: 'Pastel de Bodas 3 Pisos', cantidad: 1, precioUnitario: 2800, importe: 2800 }
    ],
    subtotal: 2413.79,
    iva: 386.21,
    total: 2800,
    facturado: true,
    uuidFactura: '89124ABC-4B81-4C72-8192-3482FBC71920',
    metodoPago: 'Transferencia'
  },
  {
    folio: 'TK-1015',
    fecha: '2026-10-06T15:45:00',
    trabajadorId: 'trab-2',
    trabajadorNombre: 'Carlos Ramos (Mostrador 2)',
    items: [
      { nombre: 'Mesa de Postres Evento', cantidad: 1, precioUnitario: 3500, importe: 3500 }
    ],
    subtotal: 3017.24,
    iva: 482.76,
    total: 3500,
    facturado: true,
    uuidFactura: '9A8B7C6D-5E4F-3A2B-1C0D-9E8F7A6B5C4D',
    metodoPago: 'Tarjeta de Crédito'
  },
  {
    folio: 'TK-1002',
    fecha: '2026-10-02T12:00:00',
    trabajadorId: 'trab-1',
    trabajadorNombre: 'María González (Turno Actual)',
    items: [
      { nombre: 'Pastel de XV Años Rosa Mexicano', cantidad: 1, precioUnitario: 2200, importe: 2200 }
    ],
    subtotal: 1896.55,
    iva: 303.45,
    total: 2200,
    facturado: true,
    uuidFactura: '1B2C3D4E-5F6A-7B8C-9D0E-1F2A3B4C5D6E',
    metodoPago: 'Tarjeta de Débito'
  }
];

const FACTURAS_INICIALES: FacturaSAT[] = [
  {
    folioFactura: 'FAC-2026-0842',
    folioTicket: 'TK-1088',
    uuidSAT: '4A8F9B2C-7E1D-4C92-A528-9842FBC91024',
    rfcReceptor: 'MOPL840212H92',
    razonSocial: 'LUCÍA MONROY PÉREZ',
    codigoPostal: '06700',
    regimenFiscal: '612 - Personas Físicas con Actividades Empresariales y Profesionales',
    usoCFDI: 'G03 - Gastos en general',
    correo: 'lucia.monroy@gmail.com',
    fechaEmision: '2026-10-13T10:20:15',
    subtotal: 437.93,
    iva: 70.07,
    total: 508.00,
    items: [
      { nombre: 'Pastel Tres Leches Tradicional', cantidad: 1, precioUnitario: 420, importe: 420 },
      { nombre: 'Conchas de Mantequilla Artesanales', cantidad: 4, precioUnitario: 22, importe: 88 }
    ]
  },
  {
    folioFactura: 'FAC-2026-0841',
    folioTicket: 'TK-1075',
    uuidSAT: 'B8291A7C-5D2B-4E90-A912-3482FBC81920',
    rfcReceptor: 'CAF090415KZ8',
    razonSocial: 'CAFETERÍAS Y RESTAURANTES DEL CENTRO S.A. DE C.V.',
    codigoPostal: '03100',
    regimenFiscal: '601 - General de Ley Personas Morales',
    usoCFDI: 'G01 - Adquisición de mercancías',
    correo: 'facturacion@grupocentrocafes.mx',
    fechaEmision: '2026-10-12T10:05:00',
    subtotal: 1275.86,
    iva: 204.14,
    total: 1480.00,
    items: [
      { nombre: 'Pastel Tres Leches Tradicional', cantidad: 2, precioUnitario: 420, importe: 840 },
      { nombre: 'Caja de Macarons', cantidad: 2, precioUnitario: 320, importe: 640 }
    ]
  }
];

@Injectable({
  providedIn: 'root'
})
export class FacturacionService {
  /** Trabajador actual en sesión (por defecto: María González) */
  readonly trabajadorActualId = signal('trab-1');
  readonly trabajadorActualNombre = signal('María González (Turno Matutino)');

  /** Lista reactiva de todas las ventas */
  readonly ventas = signal<VentaTicket[]>(this.cargarVentas());

  /** Lista reactiva de facturas emitidas */
  readonly facturas = signal<FacturaSAT[]>(this.cargarFacturas());

  // =========================================================================
  // MÉTRICAS DE VENTAS PARA EL TRABAJADOR (MES, SEMANA, DÍA)
  // =========================================================================

  /** Ventas del trabajador en el DÍA (Hoy 13 de Octubre) */
  readonly ventasTrabajadorDia = computed(() => {
    const trabId = this.trabajadorActualId();
    const hoyStr = '2026-10-13';
    return this.ventas().filter(v => v.trabajadorId === trabId && v.fecha.startsWith(hoyStr));
  });

  readonly totalTrabajadorDia = computed(() => {
    return this.ventasTrabajadorDia().reduce((acc, v) => acc + v.total, 0);
  });

  /** Ventas del trabajador en la SEMANA (11 al 17 de Octubre 2026) */
  readonly ventasTrabajadorSemana = computed(() => {
    const trabId = this.trabajadorActualId();
    // Semana actual de Octubre (días 11, 12, 13, 14, 15, 16, 17)
    return this.ventas().filter(v => {
      if (v.trabajadorId !== trabId) return false;
      const dia = parseInt(v.fecha.substring(8, 10), 10);
      return v.fecha.startsWith('2026-10') && dia >= 11 && dia <= 17;
    });
  });

  readonly totalTrabajadorSemana = computed(() => {
    return this.ventasTrabajadorSemana().reduce((acc, v) => acc + v.total, 0);
  });

  /** Ventas del trabajador en el MES (Octubre 2026) */
  readonly ventasTrabajadorMes = computed(() => {
    const trabId = this.trabajadorActualId();
    return this.ventas().filter(v => v.trabajadorId === trabId && v.fecha.startsWith('2026-10'));
  });

  readonly totalTrabajadorMes = computed(() => {
    return this.ventasTrabajadorMes().reduce((acc, v) => acc + v.total, 0);
  });

  // =========================================================================
  // MÉTRICAS DE VENTAS TOTALES DE LA TIENDA PARA EL ADMINISTRADOR (MES, SEMANA, DÍA)
  // =========================================================================

  /** Ventas Totales de la Tienda en el DÍA */
  readonly ventasTiendaDia = computed(() => {
    const hoyStr = '2026-10-13';
    return this.ventas().filter(v => v.fecha.startsWith(hoyStr));
  });

  readonly totalTiendaDia = computed(() => {
    return this.ventasTiendaDia().reduce((acc, v) => acc + v.total, 0);
  });

  /** Ventas Totales de la Tienda en la SEMANA */
  readonly ventasTiendaSemana = computed(() => {
    return this.ventas().filter(v => {
      const dia = parseInt(v.fecha.substring(8, 10), 10);
      return v.fecha.startsWith('2026-10') && dia >= 11 && dia <= 17;
    });
  });

  readonly totalTiendaSemana = computed(() => {
    return this.ventasTiendaSemana().reduce((acc, v) => acc + v.total, 0);
  });

  /** Ventas Totales de la Tienda en el MES */
  readonly ventasTiendaMes = computed(() => {
    return this.ventas().filter(v => v.fecha.startsWith('2026-10'));
  });

  readonly totalTiendaMes = computed(() => {
    return this.ventasTiendaMes().reduce((acc, v) => acc + v.total, 0);
  });

  /** Métricas de IVA recaudado en el mes */
  readonly ivaTotalMes = computed(() => {
    return this.ventasTiendaMes().reduce((acc, v) => acc + v.iva, 0);
  });

  // =========================================================================
  // MÉTODOS DE FACTURACIÓN (CFDI SAT) PARA CLIENTES Y TRABAJADORES
  // =========================================================================

  /** Busca un ticket por su folio para facturar */
  buscarTicketPorFolio(folio: string): VentaTicket | undefined {
    const limpio = folio.trim().toUpperCase();
    return this.ventas().find(v => v.folio.toUpperCase() === limpio);
  }

  /** Emite una nueva factura SAT para un ticket de compra */
  emitirFactura(
    ticket: VentaTicket,
    datosFiscales: {
      rfc: string;
      razonSocial: string;
      codigoPostal: string;
      regimenFiscal: string;
      usoCFDI: string;
      correo: string;
    }
  ): FacturaSAT {
    const uuid = this.generarUUID();
    const folioFactura = 'FAC-2026-' + (840 + this.facturas().length + 1).toString().padStart(4, '0');
    const ahora = new Date().toISOString();

    const nuevaFactura: FacturaSAT = {
      folioFactura,
      folioTicket: ticket.folio,
      uuidSAT: uuid,
      rfcReceptor: datosFiscales.rfc.trim().toUpperCase(),
      razonSocial: datosFiscales.razonSocial.trim().toUpperCase(),
      codigoPostal: datosFiscales.codigoPostal.trim(),
      regimenFiscal: datosFiscales.regimenFiscal,
      usoCFDI: datosFiscales.usoCFDI,
      correo: datosFiscales.correo.trim().toLowerCase(),
      fechaEmision: ahora,
      subtotal: ticket.subtotal,
      iva: ticket.iva,
      total: ticket.total,
      items: ticket.items
    };

    // 1. Guardar la factura
    this.facturas.update(lista => [nuevaFactura, ...lista]);

    // 2. Marcar el ticket como facturado
    this.ventas.update(lista => {
      return lista.map(v => {
        if (v.folio === ticket.folio) {
          return { ...v, facturado: true, uuidFactura: uuid };
        }
        return v;
      });
    });

    this.guardarEnStorage();
    return nuevaFactura;
  }

  /** Registra una nueva venta (para simular ventas del trabajador o admin) */
  registrarVenta(
    items: VentaItem[],
    trabajadorId: string = this.trabajadorActualId(),
    trabajadorNombre: string = this.trabajadorActualNombre(),
    metodoPago: string = 'Efectivo'
  ): VentaTicket {
    const total = items.reduce((acc, i) => acc + i.importe, 0);
    const subtotal = Math.round((total / 1.16) * 100) / 100;
    const iva = Math.round((total - subtotal) * 100) / 100;
    const folio = 'TK-' + (1090 + this.ventas().length + 1);

    const nuevaVenta: VentaTicket = {
      folio,
      fecha: new Date().toISOString(),
      trabajadorId,
      trabajadorNombre,
      items,
      subtotal,
      iva,
      total,
      facturado: false,
      metodoPago
    };

    this.ventas.update(lista => [nuevaVenta, ...lista]);
    this.guardarEnStorage();
    return nuevaVenta;
  }

  private generarUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16).toUpperCase();
    });
  }

  private cargarVentas(): VentaTicket[] {
    try {
      const data = localStorage.getItem(STORAGE_VENTAS_KEY);
      if (data) return JSON.parse(data);
    } catch { }
    return VENTAS_INICIALES;
  }

  private cargarFacturas(): FacturaSAT[] {
    try {
      const data = localStorage.getItem(STORAGE_FACTURAS_KEY);
      if (data) return JSON.parse(data);
    } catch { }
    return FACTURAS_INICIALES;
  }

  private guardarEnStorage(): void {
    try {
      localStorage.setItem(STORAGE_VENTAS_KEY, JSON.stringify(this.ventas()));
      localStorage.setItem(STORAGE_FACTURAS_KEY, JSON.stringify(this.facturas()));
    } catch { }
  }
}
