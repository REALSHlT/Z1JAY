import { Component } from '@angular/core';
import { ScrollRevealDirective } from '../../directives/scroll-reveal.directive';
import { SplitTextDirective } from '../../directives/split-text.directive';
import { COLLAB_NOTE, LINKS, PROCESS, ProcessStep, SERVICES, ServiceEntry } from '../../data/config';
import { MagneticDirective } from '../../directives/magnetic.directive';

@Component({
  selector: 'app-collaborate',
  standalone: true,
  imports: [ScrollRevealDirective, SplitTextDirective, MagneticDirective],
  templateUrl: './collaborate.html',
  styleUrl: './collaborate.scss',
})
export class Collaborate {
  readonly services: ServiceEntry[] = SERVICES;
  readonly process: ProcessStep[] = PROCESS;
  readonly note = COLLAB_NOTE;
  readonly links = LINKS;
}
