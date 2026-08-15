import { Component, signal } from '@angular/core';
import { ScrollRevealDirective } from '../../directives/scroll-reveal.directive';
import { Img } from '../shared/img';
import { SKILLS, SkillEntry } from '../../data/config';

@Component({
  selector: 'app-skills',
  standalone: true,
  imports: [ScrollRevealDirective, Img],
  templateUrl: './skills.html',
  styleUrl: './skills.scss',
})
export class Skills {
  readonly skills: SkillEntry[] = SKILLS;
  activeIndex = signal(0);

  selectSkill(index: number): void {
    this.activeIndex.set(index);
  }
}
