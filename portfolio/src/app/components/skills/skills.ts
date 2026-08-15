import { Component } from '@angular/core';
import { ScrollRevealDirective } from '../../directives/scroll-reveal.directive';
import { Img } from '../shared/img';
import { CORE_SKILLS, CoreSkill, OTHER_ABILITIES, TOOLS, ToolEntry } from '../../data/config';

@Component({
  selector: 'app-skills',
  standalone: true,
  imports: [ScrollRevealDirective, Img],
  templateUrl: './skills.html',
  styleUrl: './skills.scss',
})
export class Skills {
  readonly coreSkills: CoreSkill[] = CORE_SKILLS;
  readonly otherAbilities: string[] = OTHER_ABILITIES;
  readonly tools: ToolEntry[] = TOOLS;
}
