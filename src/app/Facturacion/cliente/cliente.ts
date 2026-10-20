import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { FacturacionService, VentaTicket, FacturaSAT } from '../facturacion.service';

@Component({
  selector: 'app-cliente',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './cliente.html',
  styleUrl: './cliente.css',
})
export class Cliente {
  protected readonly facturacionService = inject(FacturacionService);

  /** Folio de ticket ingresado */
  readonly folioTicketInput = signal('TK-1089');

  /** Ticket encontrado */
  readonly ticketSeleccionado = signal<VentaTicket | null>(null);

  /** Formulario de Datos Fiscales SAT */
  readonly datosFiscales = signal({
    rfc: 'MOPL840212H92',
    razonSocial: 'LUCÍA MONROY PÉREZ',
    codigoPostal: '06700',
    regimenFiscal: '612 - Personas Físicas con Actividades Empresariales y Profesionales',
    usoCFDI: 'G03 - Gastos en general',
    correo: 'lucia.monroy@gmail.com',
  });

  /** Factura recién generada */
  readonly facturaGenerada = signal<FacturaSAT | null>(null);

  /** Mensaje de alerta o feedback */
  readonly mensajeFeedback = signal<string | null>(null);
  readonly errorFeedback = signal<string | null>(null);

  /** Catálogos SAT para el formulario */
  readonly regimenesFiscales = [
    '601 - General de Ley Personas Morales',
    '605 - Sueldos y Salarios e Ingresos Asimilados a Salarios',
    '612 - Personas Físicas con Actividades Empresariales y Profesionales',
    '616 - Sin obligaciones fiscales',
    '621 - Incorporación Fiscal',
    '626 - Régimen Simplificado de Confianza (RESICO)',
  ];

  readonly usosCFDI = [
    'G01 - Adquisición de mercancías',
    'G03 - Gastos en general',
    'S01 - Sin efectos fiscales',
    'D01 - Honorarios médicos, dentales y gastos hospitalarios',
  ];

  constructor() {
    // Buscar el ticket por defecto para facilitar pruebas
    this.buscarTicket();
  }

  buscarTicket(): void {
    this.errorFeedback.set(null);
    this.mensajeFeedback.set(null);
    this.facturaGenerada.set(null);

    const ticket = this.facturacionService.buscarTicketPorFolio(this.folioTicketInput());
    if (ticket) {
      this.ticketSeleccionado.set(ticket);
      if (ticket.facturado) {
        // Si ya está facturado, buscar la factura correspondiente
        const fac = this.facturacionService.facturas().find(f => f.folioTicket === ticket.folio);
        if (fac) {
          this.facturaGenerada.set(fac);
          this.mensajeFeedback.set(`Este ticket ya fue facturado previamente bajo el folio ${fac.folioFactura}.`);
        }
      }
    } else {
      this.ticketSeleccionado.set(null);
      this.errorFeedback.set(`No encontramos ningún ticket con el folio "${this.folioTicketInput()}". Revisa tu recibo o prueba con otro número.`);
    }
  }

  seleccionarTicketEjemplo(folio: string): void {
    this.folioTicketInput.set(folio);
    this.buscarTicket();
  }

  generarFactura(): void {
    const ticket = this.ticketSeleccionado();
    if (!ticket) return;

    const datos = this.datosFiscales();
    if (!datos.rfc || datos.rfc.length < 12) {
      this.errorFeedback.set('Por favor ingresa un RFC válido (12 o 13 caracteres con homoclave).');
      return;
    }
    if (!datos.razonSocial.trim()) {
      this.errorFeedback.set('Por favor ingresa tu Razón Social o Nombre fiscal.');
      return;
    }
    if (!datos.codigoPostal || datos.codigoPostal.length !== 5) {
      this.errorFeedback.set('El código postal fiscal debe contener 5 dígitos.');
      return;
    }
    if (!datos.correo || !datos.correo.includes('@')) {
      this.errorFeedback.set('Por favor ingresa un correo electrónico válido para enviarte el XML y PDF.');
      return;
    }

    this.errorFeedback.set(null);
    const factura = this.facturacionService.emitirFactura(ticket, datos);
    // this.facturaGenerada.set(factura);
    // this.mensajeFeedback.set(`¡Factura generada exitosamente con Folio Fiscal ${factura.folioFactura}! Se enviaron los archivos a ${factura.correo}.`);
  }

  descargarArchivo(tipo: 'PDF' | 'XML'): void {
    alert(`Descargando comprobante fiscal digital (${tipo}) para la factura ${this.facturaGenerada()?.folioFactura}`);
  }

  reenviarCorreo(): void {
    alert(`Comprobante fiscal reenviado satisfactoriamente a: ${this.datosFiscales().correo}`);
  }
}
