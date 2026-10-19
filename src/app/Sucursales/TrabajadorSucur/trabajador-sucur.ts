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
import { SucursalesService, Sucursal, Empleado } from '../sucursales.service';

@Component({
  selector: 'app-trabajador-sucur',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './trabajador-sucur.html',
  styleUrl: './trabajador-sucur.css',
})
export class TrabajadorSucur implements AfterViewInit, OnDestroy {
  @ViewChild('mapContainer', { static: false })
  mapContainerRef!: ElementRef<HTMLDivElement>;

  @ViewChild('chatScrollContainer', { static: false })
  chatScrollRef!: ElementRef<HTMLDivElement>;

  protected readonly sucursalesService = inject(SucursalesService);

  private map: L.Map | null = null;
  private markersMap = new Map<string, L.Marker>();

  /** Texto del nuevo mensaje a enviar */
  readonly nuevoMensajeTexto = signal<string>('');

  /** Tipo de mensaje a enviar */
  readonly tipoMensaje = signal<'normal' | 'alerta_stock' | 'pedido_urgente'>('normal');

  /** Filtro del chat */
  readonly filtroChat = signal<'todos' | 'alerta_stock' | 'pedido_urgente' | 'aviso_admin'>('todos');

  /** Modal para cambiar de perfil de empleado */
  readonly modalCambiarPerfil = signal<boolean>(false);

  /** Datos del formulario para configurar perfil personalizado */
  readonly formCustomId = signal<string>('EMP-042');
  readonly formCustomNombre = signal<string>('Carlos Mendoza');
  readonly formCustomRol = signal<string>('Encargado de Sucursal');
  readonly formCustomSucursalId = signal<string>('suc-paseo');

  /** Mensajes filtrados */
  readonly mensajesFiltrados = computed(() => {
    const f = this.filtroChat();
    const todos = this.sucursalesService.chatMensajes();
    if (f === 'todos') return todos;
    return todos.filter((m) => m.tipo === f);
  });

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initDurangoMap();
      this.scrollChatToBottom();
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
      attribution: '© OpenStreetMap | Red Operativa Olenka Y Ezis Durango',
    }).addTo(this.map);

    this.renderMarkers();
  }

  private renderMarkers(): void {
    if (!this.map) return;

    this.markersMap.forEach((m) => m.remove());
    this.markersMap.clear();

    const sucursales = this.sucursalesService.sucursales();

    sucursales.forEach((suc) => {
      const customIcon = L.divIcon({
        className: 'durango-bakery-pin',
        html: `
          <div class="pin-marker worker-pin ${suc.id === this.sucursalesService.sucursalSeleccionadaId() ? 'active' : ''}">
            <span class="pin-icon">🏪</span>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -36],
      });

      const marker = L.marker([suc.lat, suc.lng], { icon: customIcon }).addTo(this.map!);

      const popupContent = `
        <div class="branch-popup-card">
          <span class="popup-zone">${suc.zona}</span>
          <h4 class="popup-title">${suc.nombre}</h4>
          <p class="popup-addr"><strong>Encargado:</strong> ${suc.encargado} (${suc.encargadoId})</p>
          <p class="popup-hours"><strong>Tel:</strong> ${suc.telefono}</p>
          <div class="popup-status ${suc.abierto ? 'open' : 'closed'}">
            ${suc.abierto ? '● Sucursal Operando' : '○ Cerrada'}
          </div>
        </div>
      `;

      marker.bindPopup(popupContent, { maxWidth: 260, className: 'durango-leaflet-popup' });
      marker.on('click', () => {
        this.sucursalesService.seleccionarSucursal(suc.id);
      });

      this.markersMap.set(suc.id, marker);
    });
  }

  seleccionarSucursal(suc: Sucursal): void {
    this.sucursalesService.seleccionarSucursal(suc.id);
    if (this.map) {
      this.map.flyTo([suc.lat, suc.lng], 15, { duration: 1.0 });
      const marker = this.markersMap.get(suc.id);
      if (marker) marker.openPopup();
    }
    this.renderMarkers();
  }

  enviarMensaje(): void {
    const txt = this.nuevoMensajeTexto().trim();
    if (!txt) return;

    this.sucursalesService.enviarMensaje(txt, this.tipoMensaje());
    this.nuevoMensajeTexto.set('');
    this.tipoMensaje.set('normal');

    setTimeout(() => {
      this.scrollChatToBottom();
    }, 50);
  }

  seleccionarEmpleadoPreset(emp: Empleado): void {
    this.sucursalesService.seleccionarEmpleadoActivo(emp);
    this.modalCambiarPerfil.set(false);
  }

  guardarPerfilPersonalizado(): void {
    this.sucursalesService.configurarEmpleadoPersonalizado(
      this.formCustomId(),
      this.formCustomNombre(),
      this.formCustomRol(),
      this.formCustomSucursalId()
    );
    this.modalCambiarPerfil.set(false);
  }

  scrollChatToBottom(): void {
    if (this.chatScrollRef) {
      const el = this.chatScrollRef.nativeElement;
      el.scrollTop = el.scrollHeight;
    }
  }
}
