import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import * as L from 'leaflet';
import { SucursalesService, Sucursal, InventarioItem } from '../sucursales.service';

@Component({
  selector: 'app-admin-sucur',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin-sucur.html',
  styleUrl: './admin-sucur.css',
})
export class AdminSucur implements AfterViewInit, OnDestroy {
  @ViewChild('mapContainer', { static: false })
  mapContainerRef!: ElementRef<HTMLDivElement>;

  protected readonly sucursalesService = inject(SucursalesService);

  private map: L.Map | null = null;
  private markersMap = new Map<string, L.Marker>();

  /** Pestaña activa del panel de administración */
  readonly adminTab = signal<'inventario' | 'traspasos' | 'chat' | 'resumen'>('inventario');

  /** Sucursal inspeccionada para ver su inventario */
  readonly sucursalInspeccionadaId = signal<string>('suc-paseo');

  /** Sucursal inspeccionada actualmente */
  readonly sucursalInspeccionada = computed(() => {
    return (
      this.sucursalesService.sucursales().find((s) => s.id === this.sucursalInspeccionadaId()) ||
      this.sucursalesService.sucursales()[0]
    );
  });

  /** Formulario de traspaso entre sucursales */
  readonly traspasoProdId = signal<string>('prod-1');
  readonly traspasoOrigenId = signal<string>('suc-centro');
  readonly traspasoDestinoId = signal<string>('suc-paseo');
  readonly traspasoCantidad = signal<number>(3);

  /** Mensaje de aviso administrativo para el chat */
  readonly avisoAdminTexto = signal<string>('');

  /** Feedback Toast */
  readonly mensajeToast = signal<string | null>(null);

  /** Productos disponibles para el traspaso */
  readonly productosDisponibles = computed(() => {
    return this.sucursalesService.sucursales()[0]?.inventario || [];
  });

  /** Stock disponible del producto en la sucursal de origen */
  readonly stockDisponibleOrigen = computed(() => {
    const origen = this.sucursalesService
      .sucursales()
      .find((s) => s.id === this.traspasoOrigenId());
    if (!origen) return 0;
    const item = origen.inventario.find((i) => i.productoId === this.traspasoProdId());
    return item ? item.stock : 0;
  });

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initDurangoMap();
    }, 100);
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  private initDurangoMap(): void {
    if (!this.mapContainerRef || this.map) return;

    const durangoCenter: L.LatLngExpression = [24.0277, -104.6532];

    this.map = L.map(this.mapContainerRef.nativeElement, {
      center: durangoCenter,
      zoom: 12.5,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap | Monitoreo Global Olenka Y Ezis Durango',
    }).addTo(this.map);

    this.renderMarkers();
  }

  private renderMarkers(): void {
    if (!this.map) return;

    this.markersMap.forEach((m) => m.remove());
    this.markersMap.clear();

    const sucursales = this.sucursalesService.sucursales();

    sucursales.forEach((suc) => {
      const hasCriticalStock = suc.inventario.some((i) => i.stock <= i.stockMinimo);

      const customIcon = L.divIcon({
        className: 'durango-bakery-pin',
        html: `
          <div class="pin-marker admin-pin ${suc.id === this.sucursalInspeccionadaId() ? 'active' : ''} ${hasCriticalStock ? 'alert-pulse' : ''}">
            <span class="pin-icon">${hasCriticalStock ? '⚠️' : '🏢'}</span>
          </div>
        `,
        iconSize: [38, 38],
        iconAnchor: [19, 38],
        popupAnchor: [0, -38],
      });

      const marker = L.marker([suc.lat, suc.lng], { icon: customIcon }).addTo(this.map!);

      const popupContent = `
        <div class="branch-popup-card">
          <span class="popup-zone">${suc.zona}</span>
          <h4 class="popup-title">${suc.nombre}</h4>
          <p class="popup-addr"><strong>Encargado:</strong> ${suc.encargado}</p>
          <p class="popup-hours"><strong>Ventas hoy:</strong> $${suc.ventasHoy.toLocaleString('es-MX')} MXN</p>
          <div class="popup-status ${suc.abierto ? 'open' : 'closed'}">
            ${suc.abierto ? '● Abierto' : '○ Cerrado'} • ${suc.pedidosActivos} pedidos activos
          </div>
        </div>
      `;

      marker.bindPopup(popupContent, { maxWidth: 280, className: 'durango-leaflet-popup' });
      marker.on('click', () => {
        this.seleccionarParaInspeccion(suc.id);
      });

      this.markersMap.set(suc.id, marker);
    });
  }

  seleccionarParaInspeccion(id: string): void {
    this.sucursalInspeccionadaId.set(id);
    this.sucursalesService.seleccionarSucursal(id);

    const suc = this.sucursalesService.sucursales().find((s) => s.id === id);
    if (suc && this.map) {
      this.map.flyTo([suc.lat, suc.lng], 14.5, { duration: 1.0 });
      const marker = this.markersMap.get(suc.id);
      if (marker) marker.openPopup();
    }
    this.renderMarkers();
  }

  ejecutarTraspaso(): void {
    const cant = this.traspasoCantidad();
    const prodId = this.traspasoProdId();
    const origenId = this.traspasoOrigenId();
    const destinoId = this.traspasoDestinoId();

    if (origenId === destinoId) {
      this.mostrarToast('❌ La sucursal de origen y destino no pueden ser la misma.');
      return;
    }

    if (cant <= 0) {
      this.mostrarToast('❌ Ingresa una cantidad válida a traspasar.');
      return;
    }

    if (cant > this.stockDisponibleOrigen()) {
      this.mostrarToast('❌ La sucursal de origen no tiene suficiente stock disponible.');
      return;
    }

    const exito = this.sucursalesService.traspasarStock(prodId, origenId, destinoId, cant);
    if (exito) {
      this.mostrarToast('✅ Traspaso completado y notificado al chat general de sucursales.');
      this.traspasoCantidad.set(1);
    } else {
      this.mostrarToast('❌ No se pudo completar el traspaso.');
    }
  }

  modificarStockItem(productoId: string, delta: number): void {
    const suc = this.sucursalInspeccionada();
    const item = suc.inventario.find((i) => i.productoId === productoId);
    if (!item) return;

    const nuevo = Math.max(0, item.stock + delta);
    this.sucursalesService.modificarStockSucursal(suc.id, productoId, nuevo);
    this.mostrarToast(`Stock de "${item.productoNombre}" actualizado a ${nuevo} pzas.`);
  }

  toggleAperturaSucursal(sucId: string): void {
    this.sucursalesService.toggleEstadoSucursal(sucId);
    const suc = this.sucursalesService.sucursales().find((s) => s.id === sucId);
    this.mostrarToast(
      `Estado de ${suc?.nombre} actualizado a: ${suc?.abierto ? 'Abierto' : 'Cerrado'}.`
    );
    this.renderMarkers();
  }

  enviarAvisoAdmin(): void {
    const txt = this.avisoAdminTexto().trim();
    if (!txt) return;

    // Emite como administración general
    const adminEmp = {
      id: 'EMP-001',
      nombre: 'Dirección General Olenka',
      rol: 'Administración General',
      sucursalId: 'suc-centro',
      sucursalNombre: 'Corporativo Durango',
      avatar: '👑',
    };
    this.sucursalesService.seleccionarEmpleadoActivo(adminEmp);
    this.sucursalesService.enviarMensaje(`📌 AVISO OFICIAL DE DIRECCIÓN: ${txt}`, 'aviso_admin');

    this.avisoAdminTexto.set('');
    this.mostrarToast('📢 Comunicado oficial enviado a todas las sucursales.');
  }

  mostrarToast(msj: string): void {
    this.mensajeToast.set(msj);
    setTimeout(() => {
      this.mensajeToast.set(null);
    }, 3800);
  }
}
