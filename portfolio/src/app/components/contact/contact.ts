import { Component } from '@angular/core';
import { ScrollRevealDirective } from '../../directives/scroll-reveal.directive';
import { ScrollSceneDirective } from '../../directives/scroll-scene.directive';
import { LINKS } from '../../data/config';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [ScrollRevealDirective, ScrollSceneDirective],
  templateUrl: './contact.html',
  styleUrl: './contact.scss',
})
export class Contact {
  readonly links = LINKS;
}
