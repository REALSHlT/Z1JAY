import { Component } from '@angular/core';
import { LINKS } from '../../data/config';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
})
export class Footer {
  readonly links = LINKS;
}
