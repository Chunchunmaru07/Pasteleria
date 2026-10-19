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
import { SucursalesService, Sucursal } from '../sucursales.service';

@Component({
  selector: 'app-cliente-sucur',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './cliente-sucur.html',
  styleUrl: './cliente-sucur.css',
})
export class ClienteSucur implements AfterViewInit, OnDestroy {
  @ViewChild('mapContainer', { static: false })
  mapContainerRef!: ElementRef<HTMLDivElement>;

  protected readonly sucursalesService = inject(SucursalesService);

  private map: L.Map | null = null;
  private markersMap = new Map<string, L.Marker>();

  /** Filtro de búsqueda por nombre o zona */
  readonly busqueda = signal<string>('');

  /** Filtro por características */
  readonly filtroCaracteristica = signal<string>('Todas');

  /** Sucursales filtradas */
  readonly sucursalesFiltradas = computed(() => {
    const q = this.busqueda().trim().toLowerCase();
    const f = this.filtroCaracteristica();

    return this.sucursalesService.sucursales().filter((s) => {
      const coincideQ =
        !q ||
        s.nombre.toLowerCase().includes(q) ||
        s.zona.toLowerCase().includes(q) ||
        s.direccion.toLowerCase().includes(q);

      const coincideF =
        f === 'Todas' || s.caracteristicas.some((c) => c.toLowerCase().includes(f.toLowerCase()));

      return coincideQ && coincideF;
    });
  });

  ngAfterViewInit(): void {
    // Inicializar mapa de Durango con pequeño timeout para asegurar renderizado del DOM
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

    // Centro geográfico de Durango, Dgo., México
    const durangoCenter: L.LatLngExpression = [24.0277, -104.6532];

    this.map = L.map(this.mapContainerRef.nativeElement, {
      center: durangoCenter,
      zoom: 13,
      zoomControl: true,
      scrollWheelZoom: true,
    });

    // Tiles limpios y estéticos de OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors | Olenka Y Ezis Durango',
    }).addTo(this.map);

    // Agregar marcadores para cada sucursal de Durango
    this.renderMarkers();
  }

  private renderMarkers(): void {
    if (!this.map) return;

    // Limpiar marcadores previos
    this.markersMap.forEach((m) => m.remove());
    this.markersMap.clear();

    const sucursales = this.sucursalesService.sucursales();

    sucursales.forEach((suc) => {
      // Icono de Pin artesanal de pastelería con estilo mexicano
      const customIcon = L.divIcon({
        className: 'durango-bakery-pin',
        html: `
          <div class="pin-marker ${suc.id === this.sucursalesService.sucursalSeleccionadaId() ? 'active' : ''}">
            <span class="pin-icon">🎂</span>
            <span class="pin-pulse"></span>
          </div>
        `,
        iconSize: [38, 38],
        iconAnchor: [19, 38],
        popupAnchor: [0, -38],
      });

      const marker = L.marker([suc.lat, suc.lng], { icon: customIcon }).addTo(this.map!);

      // Popup informativo con foto y datos
      const popupContent = `
        <div class="branch-popup-card">
          <img src="${suc.imagen}" alt="${suc.nombre}" class="popup-img" />
          <div class="popup-body">
            <span class="popup-zone">${suc.zona}</span>
            <h4 class="popup-title">${suc.nombre}</h4>
            <p class="popup-addr">${suc.direccion}</p>
            <div class="popup-status ${suc.abierto ? 'open' : 'closed'}">
              ${suc.abierto ? '● Abierto ahora' : '○ Cerrado temporalmente'}
            </div>
            <p class="popup-hours">${suc.horario}</p>
            <a href="https://www.google.com/maps/search/?api=1&query=${suc.lat},${suc.lng}" target="_blank" class="btn-popup-maps">
              Ver cómo llegar en Google Maps ↗
            </a>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent, { maxWidth: 280, className: 'durango-leaflet-popup' });

      marker.on('click', () => {
        this.seleccionarSucursal(suc);
      });

      this.markersMap.set(suc.id, marker);
    });
  }

  seleccionarSucursal(suc: Sucursal): void {
    this.sucursalesService.seleccionarSucursal(suc.id);

    if (this.map) {
      this.map.flyTo([suc.lat, suc.lng], 15, { duration: 1.2 });
      const marker = this.markersMap.get(suc.id);
      if (marker) {
        marker.openPopup();
      }
    }

    // Actualizar clase activa en todos los marcadores
    this.renderMarkers();
  }

  verTodasEnMapa(): void {
    if (!this.map) return;
    const durangoCenter: L.LatLngExpression = [24.0277, -104.6532];
    this.map.flyTo(durangoCenter, 13, { duration: 1.0 });
  }
}
