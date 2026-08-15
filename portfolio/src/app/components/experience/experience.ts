import { Component } from '@angular/core';
import { ScrollRevealDirective } from '../../directives/scroll-reveal.directive';
import { SplitTextDirective } from '../../directives/split-text.directive';
import { EXPERIENCE, ExperienceEntry } from '../../data/config';

@Component({
  selector: 'app-experience',
  standalone: true,
  imports: [ScrollRevealDirective, SplitTextDirective],
  templateUrl: './experience.html',
  styleUrl: './experience.scss',
})
export class Experience {
  readonly experiences: ExperienceEntry[] = EXPERIENCE;
}
