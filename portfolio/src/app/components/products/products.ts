import { Component } from '@angular/core';
import { ScrollRevealDirective } from '../../directives/scroll-reveal.directive';
import { ScrollSceneDirective } from '../../directives/scroll-scene.directive';
import { SplitTextDirective } from '../../directives/split-text.directive';
import { Tilt3dDirective } from '../../directives/tilt3d.directive';
import { PRODUCTS, ProductEntry } from '../../data/config';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [ScrollRevealDirective, ScrollSceneDirective, SplitTextDirective, Tilt3dDirective],
  templateUrl: './products.html',
  styleUrl: './products.scss',
})
export class Products {
  readonly products: ProductEntry[] = PRODUCTS;
}
