import { Component, signal } from '@angular/core';
import { ScrollRevealDirective } from '../../directives/scroll-reveal.directive';
import { SKILLS, SkillEntry } from '../../data/config';

@Component({
  selector: 'app-skills',
  standalone: true,
  imports: [ScrollRevealDirective],
  templateUrl: './skills.html',
  styleUrl: './skills.scss',
})
export class Skills {
  readonly skills: SkillEntry[] = SKILLS;
  activeIndex = signal(0);

  selectSkill(index: number): void {
    this.activeIndex.set(index);
  }

  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    const slide = target.closest('.skill-slide') as HTMLElement | null;
    if (slide) slide.style.background = 'linear-gradient(135deg,#f5ece7,#e9e1dc)';
    target.remove();
  }
}
