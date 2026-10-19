import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Encabezado } from './encabezado/encabezado';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Encabezado],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('Olenka Y Ezis - Tradición en lo Dulce');
}
