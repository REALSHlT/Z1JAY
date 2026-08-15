import { Component } from '@angular/core';
import { ScrollRevealDirective } from '../../directives/scroll-reveal.directive';
import { SplitTextDirective } from '../../directives/split-text.directive';
import { PRODUCTS, ProductEntry } from '../../data/config';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [ScrollRevealDirective, SplitTextDirective],
  templateUrl: './products.html',
  styleUrl: './products.scss',
})
export class Products {
  readonly products: ProductEntry[] = PRODUCTS;
}
