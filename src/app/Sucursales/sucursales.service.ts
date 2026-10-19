import { Injectable, signal, computed } from '@angular/core';

export interface InventarioItem {
  productoId: string;
  productoNombre: string;
  categoria: string;
  stock: number;
  stockMinimo: number;
  precio: number;
}

export interface Empleado {
  id: string;
  nombre: string;
  rol: string;
  sucursalId: string;
  sucursalNombre: string;
  avatar: string;
}

export interface Sucursal {
  id: string;
  nombre: string;
  zona: string;
  direccion: string;
  referencia: string;
  telefono: string;
  horario: string;
  lat: number;
  lng: number;
  abierto: boolean;
  encargado: string;
  encargadoId: string;
  imagen: string;
  caracteristicas: string[];
  ventasHoy: number;
  pedidosActivos: number;
  inventario: InventarioItem[];
  empleados: Empleado[];
}

export interface MensajeChat {
  id: string;
  empleadoId: string;
  empleadoNombre: string;
  sucursalId: string;
  sucursalNombre: string;
  rol: string;
  avatar: string;
  texto: string;
  fechaHora: string;
  tipo: 'normal' | 'alerta_stock' | 'pedido_urgente' | 'aviso_admin';
  productoRelacionado?: string;
}

const STORAGE_KEY_SUCURSALES = 'olenka_ezis_durango_sucursales';
const STORAGE_KEY_CHAT = 'olenka_ezis_durango_chat';

const INVENTARIO_BASE: InventarioItem[] = [
  { productoId: 'prod-1', productoNombre: 'Pastel Tres Leches Tradicional', categoria: 'Pasteles', stock: 8, stockMinimo: 3, precio: 420 },
  { productoId: 'prod-2', productoNombre: 'Conchas de Mantequilla Artesanales', categoria: 'Pan Dulce', stock: 45, stockMinimo: 15, precio: 22 },
  { productoId: 'prod-3', productoNombre: 'Pastel de Cajeta de Celaya', categoria: 'Pasteles', stock: 6, stockMinimo: 2, precio: 460 },
  { productoId: 'prod-4', productoNombre: 'Pan de Muerto Tradicional', categoria: 'Pan Dulce', stock: 25, stockMinimo: 10, precio: 35 },
  { productoId: 'prod-5', productoNombre: 'Cheesecake de Frambuesa Real', categoria: 'Tartas', stock: 5, stockMinimo: 2, precio: 450 },
  { productoId: 'prod-6', productoNombre: 'Pastel Selva Negra Cacao Oaxaqueño', categoria: 'Pasteles', stock: 4, stockMinimo: 2, precio: 490 },
  { productoId: 'prod-7', productoNombre: 'Orejas de Hojaldre Caramelizadas', categoria: 'Pan Dulce', stock: 32, stockMinimo: 12, precio: 18 },
  { productoId: 'prod-8', productoNombre: 'Caja de Macarons Artesanales (12 pzas)', categoria: 'Repostería', stock: 10, stockMinimo: 4, precio: 320 }
];

const SUCURSALES_INICIALES: Sucursal[] = [
  {
    id: 'suc-centro',
    nombre: 'Sucursal Matriz Centro Histórico',
    zona: 'Centro Histórico',
    direccion: 'Calle 5 de Febrero #704 Pte, Zona Centro',
    referencia: 'Frente a Plaza de Armas y Catedral Basílica Menor de Durango',
    telefono: '(618) 811-2045',
    horario: 'Lun a Sáb: 7:00 AM - 9:30 PM | Dom: 8:00 AM - 9:00 PM',
    lat: 24.0253,
    lng: -104.6702,
    abierto: true,
    encargado: 'Mtra. Elena Soto',
    encargadoId: 'EMP-010',
    imagen: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80',
    caracteristicas: ['Horno de leña artesanal', 'Cafetería de olla tradicional', 'Terraza colonial', 'Pasteles de boda sobre pedido'],
    ventasHoy: 18450,
    pedidosActivos: 7,
    inventario: [
      { ...INVENTARIO_BASE[0], stock: 9 },
      { ...INVENTARIO_BASE[1], stock: 60 },
      { ...INVENTARIO_BASE[2], stock: 8 },
      { ...INVENTARIO_BASE[3], stock: 30 },
      { ...INVENTARIO_BASE[4], stock: 6 },
      { ...INVENTARIO_BASE[5], stock: 7 },
      { ...INVENTARIO_BASE[6], stock: 40 },
      { ...INVENTARIO_BASE[7], stock: 14 }
    ],
    empleados: [
      { id: 'EMP-010', nombre: 'Elena Soto', rol: 'Encargada de Sucursal', sucursalId: 'suc-centro', sucursalNombre: 'Centro Histórico', avatar: '👩‍🍳' },
      { id: 'EMP-014', nombre: 'Mateo Morales', rol: 'Maestro Panadero', sucursalId: 'suc-centro', sucursalNombre: 'Centro Histórico', avatar: '👨‍🍳' },
      { id: 'EMP-019', nombre: 'Lucía Valenzuela', rol: 'Atención & Caja', sucursalId: 'suc-centro', sucursalNombre: 'Centro Histórico', avatar: '👩' }
    ]
  },
  {
    id: 'suc-paseo',
    nombre: 'Sucursal Paseo Durango',
    zona: 'Blvd. Felipe Pescador',
    direccion: 'Blvd. Felipe Pescador #1401, Local B-22, Col. Esperanza',
    referencia: 'Dentro del Centro Comercial Paseo Durango (Área Gourmet)',
    telefono: '(618) 829-5510',
    horario: 'Lun a Dom: 10:00 AM - 9:00 PM',
    lat: 24.0371,
    lng: -104.6465,
    abierto: true,
    encargado: 'Lic. Carlos Mendoza',
    encargadoId: 'EMP-042',
    imagen: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80',
    caracteristicas: ['Vitrina refrigerada gourmet', 'Empaque para regalo fino', 'Entrega express', 'Estacionamiento de plaza'],
    ventasHoy: 14200,
    pedidosActivos: 5,
    inventario: [
      { ...INVENTARIO_BASE[0], stock: 2 }, // Alerta de stock bajo!
      { ...INVENTARIO_BASE[1], stock: 25 },
      { ...INVENTARIO_BASE[2], stock: 4 },
      { ...INVENTARIO_BASE[3], stock: 15 },
      { ...INVENTARIO_BASE[4], stock: 3 },
      { ...INVENTARIO_BASE[5], stock: 2 },
      { ...INVENTARIO_BASE[6], stock: 20 },
      { ...INVENTARIO_BASE[7], stock: 12 }
    ],
    empleados: [
      { id: 'EMP-042', nombre: 'Carlos Mendoza', rol: 'Encargado de Sucursal', sucursalId: 'suc-paseo', sucursalNombre: 'Paseo Durango', avatar: '👨‍💼' },
      { id: 'EMP-045', nombre: 'Diana Galván', rol: 'Decoradora de Pasteles', sucursalId: 'suc-paseo', sucursalNombre: 'Paseo Durango', avatar: '👩‍🎨' }
    ]
  },
  {
    id: 'suc-alamedas',
    nombre: 'Sucursal Las Alamedas & 20 de Noviembre',
    zona: 'Barrio de Analco / Alamedas',
    direccion: 'Av. 20 de Noviembre #1204 Pte, Barrio de Analco',
    referencia: 'Junto al emblemático Corredor de Las Alamedas',
    telefono: '(618) 813-9080',
    horario: 'Lun a Sáb: 7:30 AM - 9:00 PM | Dom: 8:00 AM - 8:30 PM',
    lat: 24.0215,
    lng: -104.6784,
    abierto: true,
    encargado: 'Brenda Torres',
    encargadoId: 'EMP-067',
    imagen: 'https://images.unsplash.com/photo-1517433670267-08bbd4be890f?auto=format&fit=crop&w=600&q=80',
    caracteristicas: ['Terraza bajo los álamos', 'Conchas calientes cada hora', 'Bebidas artesanales', 'Área pet friendly'],
    ventasHoy: 11900,
    pedidosActivos: 4,
    inventario: [
      { ...INVENTARIO_BASE[0], stock: 5 },
      { ...INVENTARIO_BASE[1], stock: 5 }, // Alerta de stock bajo!
      { ...INVENTARIO_BASE[2], stock: 5 },
      { ...INVENTARIO_BASE[3], stock: 22 },
      { ...INVENTARIO_BASE[4], stock: 4 },
      { ...INVENTARIO_BASE[5], stock: 3 },
      { ...INVENTARIO_BASE[6], stock: 35 },
      { ...INVENTARIO_BASE[7], stock: 8 }
    ],
    empleados: [
      { id: 'EMP-067', nombre: 'Brenda Torres', rol: 'Encargada de Sucursal', sucursalId: 'suc-alamedas', sucursalNombre: 'Las Alamedas', avatar: '👩‍🍳' },
      { id: 'EMP-071', nombre: 'Jorge Ibarra', rol: 'Barista & Mostrador', sucursalId: 'suc-alamedas', sucursalNombre: 'Las Alamedas', avatar: '👨' }
    ]
  },
  {
    id: 'suc-parque',
    nombre: 'Sucursal Lomas del Parque & Guadiana',
    zona: 'Parque Guadiana / Lomas',
    direccion: 'Calzada del Parque #315, Col. Lomas del Parque',
    referencia: 'A 200m del Lago de los Patos y Parque Guadiana',
    telefono: '(618) 817-4422',
    horario: 'Mar a Dom: 8:00 AM - 8:30 PM | Lun cerrado por mantenimiento',
    lat: 24.0152,
    lng: -104.6865,
    abierto: true,
    encargado: 'Roberto Quiñones',
    encargadoId: 'EMP-088',
    imagen: 'https://images.unsplash.com/photo-1486427944299-d1955d23e34d?auto=format&fit=crop&w=600&q=80',
    caracteristicas: ['Cestas de picnic con pan dulce', 'Tartas individuales', 'Jardín con sombrillas', 'Mesa de degustación'],
    ventasHoy: 9850,
    pedidosActivos: 3,
    inventario: [
      { ...INVENTARIO_BASE[0], stock: 4 },
      { ...INVENTARIO_BASE[1], stock: 30 },
      { ...INVENTARIO_BASE[2], stock: 3 },
      { ...INVENTARIO_BASE[3], stock: 18 },
      { ...INVENTARIO_BASE[4], stock: 7 },
      { ...INVENTARIO_BASE[5], stock: 4 },
      { ...INVENTARIO_BASE[6], stock: 25 },
      { ...INVENTARIO_BASE[7], stock: 9 }
    ],
    empleados: [
      { id: 'EMP-088', nombre: 'Roberto Quiñones', rol: 'Encargado de Sucursal', sucursalId: 'suc-parque', sucursalNombre: 'Lomas del Parque', avatar: '👨‍🍳' },
      { id: 'EMP-092', nombre: 'Valeria Cárdenas', rol: 'Repostería Fina', sucursalId: 'suc-parque', sucursalNombre: 'Lomas del Parque', avatar: '👩‍🍳' }
    ]
  },
  {
    id: 'suc-villa',
    nombre: 'Sucursal Blvd. Francisco Villa & El Saltito',
    zona: 'Oriente / Blvd. Francisco Villa',
    direccion: 'Blvd. Francisco Villa #3205, Fracc. El Saltito',
    referencia: 'Frente a Plaza Punto Guadiana, acceso vial rápido',
    telefono: '(618) 825-7733',
    horario: 'Lun a Sáb: 8:00 AM - 9:30 PM | Dom: 9:00 AM - 8:00 PM',
    lat: 24.0450,
    lng: -104.6180,
    abierto: true,
    encargado: 'Sofía Ramírez',
    encargadoId: 'EMP-103',
    imagen: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80',
    caracteristicas: ['Taller central de diseño 3D', 'Drive-thru / Ventanilla exprés', 'Pedidos mayores para eventos', 'Cámara de refrigeración'],
    ventasHoy: 22100,
    pedidosActivos: 9,
    inventario: [
      { ...INVENTARIO_BASE[0], stock: 12 },
      { ...INVENTARIO_BASE[1], stock: 50 },
      { ...INVENTARIO_BASE[2], stock: 10 },
      { ...INVENTARIO_BASE[3], stock: 28 },
      { ...INVENTARIO_BASE[4], stock: 8 },
      { ...INVENTARIO_BASE[5], stock: 8 },
      { ...INVENTARIO_BASE[6], stock: 35 },
      { ...INVENTARIO_BASE[7], stock: 16 }
    ],
    empleados: [
      { id: 'EMP-103', nombre: 'Sofía Ramírez', rol: 'Encargada de Sucursal', sucursalId: 'suc-villa', sucursalNombre: 'Francisco Villa', avatar: '👩‍💼' },
      { id: 'EMP-107', nombre: 'Andrés Rosales', rol: 'Maestro Pastelero 3D', sucursalId: 'suc-villa', sucursalNombre: 'Francisco Villa', avatar: '👨‍🎨' },
      { id: 'EMP-112', nombre: 'Gabriela Luna', rol: 'Logística de Envíos', sucursalId: 'suc-villa', sucursalNombre: 'Francisco Villa', avatar: '👩‍💻' }
    ]
  }
];

const MENSAJES_INICIALES: MensajeChat[] = [
  {
    id: 'msg-1',
    empleadoId: 'EMP-042',
    empleadoNombre: 'Carlos Mendoza',
    sucursalId: 'suc-paseo',
    sucursalNombre: 'Paseo Durango',
    rol: 'Encargado de Sucursal',
    avatar: '👨‍💼',
    texto: 'Buen día equipo. En Paseo Durango nos estamos quedando con solo 2 Pasteles Tres Leches y ya nos apartaron 3 para las 3:00 PM. ¿Alguna sucursal con excedente para hacer traspaso?',
    fechaHora: '09:15 AM',
    tipo: 'alerta_stock',
    productoRelacionado: 'Pastel Tres Leches'
  },
  {
    id: 'msg-2',
    empleadoId: 'EMP-010',
    empleadoNombre: 'Elena Soto',
    sucursalId: 'suc-centro',
    sucursalNombre: 'Centro Histórico',
    rol: 'Encargada de Sucursal',
    avatar: '👩‍🍳',
    texto: 'Hola Carlos! En Centro Histórico tenemos 9 en stock recién decorados. Te podemos mandar 3 piezas con el repartidor en la ronda de las 11:30 AM.',
    fechaHora: '09:22 AM',
    tipo: 'normal'
  },
  {
    id: 'msg-3',
    empleadoId: 'EMP-067',
    empleadoNombre: 'Brenda Torres',
    sucursalId: 'suc-alamedas',
    sucursalNombre: 'Las Alamedas',
    rol: 'Encargada de Sucursal',
    avatar: '👩‍🍳',
    texto: '¡Aviso Alamedas! Hay festival escolar en el parque y las Conchas de Mantequilla están volando, nos quedan solo 5 piezas. El taller de Francisco Villa ya nos mandó charolas al horno.',
    fechaHora: '09:40 AM',
    tipo: 'pedido_urgente',
    productoRelacionado: 'Conchas de Mantequilla'
  },
  {
    id: 'msg-4',
    empleadoId: 'EMP-001',
    empleadoNombre: 'Dirección General Olenka',
    sucursalId: 'suc-centro',
    sucursalNombre: 'Corporativo Durango',
    rol: 'Administración General',
    avatar: '👑',
    texto: '📌 AVISO GENERAL ADMIN: Excelente coordinación inter-sucursales. Ya quedó registrado en el sistema el traspaso de Centro a Paseo Durango. Recuerden verificar el sello de cadena de frío en camionetas.',
    fechaHora: '10:05 AM',
    tipo: 'aviso_admin'
  }
];

@Injectable({
  providedIn: 'root'
})
export class SucursalesService {
  /** Lista reactiva de sucursales en Durango */
  readonly sucursales = signal<Sucursal[]>(this.cargarSucursales());

  /** Chat general entre todas las sucursales de Durango */
  readonly chatMensajes = signal<MensajeChat[]>(this.cargarChat());

  /** Empleado activo seleccionado actualmente en el sistema */
  readonly empleadoActivo = signal<Empleado>(this.getEmpleadoPorDefecto());

  /** Sucursal activa o seleccionada para ver detalles */
  readonly sucursalSeleccionadaId = signal<string>('suc-centro');

  /** Sucursal actualmente seleccionada */
  readonly sucursalSeleccionada = computed(() => {
    const id = this.sucursalSeleccionadaId();
    return this.sucursales().find(s => s.id === id) || this.sucursales()[0];
  });

  /** Total de ventas acumuladas hoy en todas las sucursales */
  readonly totalVentasHoyTodas = computed(() => {
    return this.sucursales().reduce((acc, s) => acc + s.ventasHoy, 0);
  });

  /** Total de pedidos activos en todas las sucursales */
  readonly totalPedidosActivosTodas = computed(() => {
    return this.sucursales().reduce((acc, s) => acc + s.pedidosActivos, 0);
  });

  /** Alertas de inventario crítico en cualquier sucursal (stock <= stockMinimo) */
  readonly alertasStockGlobal = computed(() => {
    const alertas: { sucursal: string; sucursalId: string; item: InventarioItem }[] = [];
    for (const suc of this.sucursales()) {
      for (const item of suc.inventario) {
        if (item.stock <= item.stockMinimo) {
          alertas.push({ sucursal: suc.nombre, sucursalId: suc.id, item });
        }
      }
    }
    return alertas;
  });

  /** Todos los empleados registrados de todas las sucursales */
  readonly todosLosEmpleados = computed(() => {
    const lista: Empleado[] = [];
    for (const suc of this.sucursales()) {
      lista.push(...suc.empleados);
    }
    return lista;
  });

  private cargarSucursales(): Sucursal[] {
    try {
      const guardadas = localStorage.getItem(STORAGE_KEY_SUCURSALES);
      if (guardadas) {
        const parsed = JSON.parse(guardadas);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return SUCURSALES_INICIALES;
  }

  private cargarChat(): MensajeChat[] {
    try {
      const guardado = localStorage.getItem(STORAGE_KEY_CHAT);
      if (guardado) {
        const parsed = JSON.parse(guardado);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return MENSAJES_INICIALES;
  }

  private persistirSucursales(): void {
    try {
      localStorage.setItem(STORAGE_KEY_SUCURSALES, JSON.stringify(this.sucursales()));
    } catch {}
  }

  private persistirChat(): void {
    try {
      localStorage.setItem(STORAGE_KEY_CHAT, JSON.stringify(this.chatMensajes()));
    } catch {}
  }

  private getEmpleadoPorDefecto(): Empleado {
    return {
      id: 'EMP-042',
      nombre: 'Carlos Mendoza',
      rol: 'Encargado de Sucursal',
      sucursalId: 'suc-paseo',
      sucursalNombre: 'Paseo Durango',
      avatar: '👨‍💼'
    };
  }

  // =========================================================================
  // ACCIONES DE CHAT INTER-SUCURSALES
  // =========================================================================

  /** Envía un nuevo mensaje al chat general de sucursales */
  enviarMensaje(
    texto: string,
    tipo: 'normal' | 'alerta_stock' | 'pedido_urgente' | 'aviso_admin' = 'normal',
    productoRelacionado?: string
  ): void {
    if (!texto.trim()) return;

    const emp = this.empleadoActivo();
    const ahora = new Date();
    const fechaHora = ahora.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true });

    const nuevoMensaje: MensajeChat = {
      id: 'msg-' + Date.now(),
      empleadoId: emp.id,
      empleadoNombre: emp.nombre,
      sucursalId: emp.sucursalId,
      sucursalNombre: emp.sucursalNombre,
      rol: emp.rol,
      avatar: emp.avatar,
      texto: texto.trim(),
      fechaHora,
      tipo,
      productoRelacionado
    };

    this.chatMensajes.update(mensajes => [...mensajes, nuevoMensaje]);
    this.persistirChat();
  }

  /** Permite cambiar el perfil del empleado activo que está chateando */
  seleccionarEmpleadoActivo(empleado: Empleado): void {
    this.empleadoActivo.set(empleado);
  }

  /** Permite al usuario configurar un empleado personalizado con su propio ID y sucursal */
  configurarEmpleadoPersonalizado(id: string, nombre: string, rol: string, sucursalId: string): void {
    const suc = this.sucursales().find(s => s.id === sucursalId);
    const nuevoEmp: Empleado = {
      id: id.trim().toUpperCase() || 'EMP-999',
      nombre: nombre.trim() || 'Colaborador Olenka',
      rol: rol.trim() || 'Atención en Sucursal',
      sucursalId: sucursalId,
      sucursalNombre: suc ? suc.nombre : 'Durango',
      avatar: '🧑‍🍳'
    };
    this.empleadoActivo.set(nuevoEmp);
  }

  // =========================================================================
  // ACCIONES DE ADMINISTRADOR: VER Y GESTIONAR OTRAS PASTELERÍAS
  // =========================================================================

  /** Traspasar stock entre dos sucursales */
  traspasarStock(
    productoId: string,
    origenSucursalId: string,
    destinoSucursalId: string,
    cantidad: number
  ): boolean {
    if (cantidad <= 0 || origenSucursalId === destinoSucursalId) return false;

    let exito = false;
    this.sucursales.update(lista => {
      const origen = lista.find(s => s.id === origenSucursalId);
      const destino = lista.find(s => s.id === destinoSucursalId);
      if (!origen || !destino) return lista;

      const itemOrigen = origen.inventario.find(i => i.productoId === productoId);
      const itemDestino = destino.inventario.find(i => i.productoId === productoId);
      if (!itemOrigen || !itemDestino || itemOrigen.stock < cantidad) return lista;

      exito = true;
      return lista.map(s => {
        if (s.id === origenSucursalId) {
          return {
            ...s,
            inventario: s.inventario.map(i =>
              i.productoId === productoId ? { ...i, stock: i.stock - cantidad } : i
            )
          };
        }
        if (s.id === destinoSucursalId) {
          return {
            ...s,
            inventario: s.inventario.map(i =>
              i.productoId === productoId ? { ...i, stock: i.stock + cantidad } : i
            )
          };
        }
        return s;
      });
    });

    if (exito) {
      this.persistirSucursales();
      // Enviar aviso automático al chat general
      const prodNombre = INVENTARIO_BASE.find(i => i.productoId === productoId)?.productoNombre || 'Producto';
      const origenNom = this.sucursales().find(s => s.id === origenSucursalId)?.nombre || origenSucursalId;
      const destinoNom = this.sucursales().find(s => s.id === destinoSucursalId)?.nombre || destinoSucursalId;
      this.enviarMensaje(
        `📦 TRASPASO REGISTRADO: Se transfirieron ${cantidad} pzas de "${prodNombre}" desde ${origenNom} hacia ${destinoNom}.`,
        'aviso_admin'
      );
    }

    return exito;
  }

  /** Modificar stock directamente de una sucursal (para admin) */
  modificarStockSucursal(sucursalId: string, productoId: string, nuevoStock: number): void {
    this.sucursales.update(lista => {
      return lista.map(s => {
        if (s.id !== sucursalId) return s;
        return {
          ...s,
          inventario: s.inventario.map(i =>
            i.productoId === productoId ? { ...i, stock: Math.max(0, Math.floor(nuevoStock)) } : i
          )
        };
      });
    });
    this.persistirSucursales();
  }

  /** Alternar estado de apertura de una sucursal */
  toggleEstadoSucursal(sucursalId: string): void {
    this.sucursales.update(lista => {
      return lista.map(s => {
        if (s.id !== sucursalId) return s;
        return { ...s, abierto: !s.abierto };
      });
    });
    this.persistirSucursales();
  }

  /** Seleccionar una sucursal para enfocar en mapa y detalles */
  seleccionarSucursal(id: string): void {
    this.sucursalSeleccionadaId.set(id);
  }

  /** Restablecer datos originales */
  restablecerSucursales(): void {
    this.sucursales.set(SUCURSALES_INICIALES);
    this.chatMensajes.set(MENSAJES_INICIALES);
    this.persistirSucursales();
    this.persistirChat();
  }
}
