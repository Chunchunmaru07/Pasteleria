import { Component } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';

@Component({
  selector: 'app-general',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  templateUrl: './general.html',
  styleUrl: './general.css',
})
export class General { }
