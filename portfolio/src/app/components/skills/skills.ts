import { Component } from '@angular/core';
import { ScrollRevealDirective } from '../../directives/scroll-reveal.directive';
import { ScrollSceneDirective } from '../../directives/scroll-scene.directive';
import { SplitTextDirective } from '../../directives/split-text.directive';
import { Img } from '../shared/img';
import { CORE_SKILLS, CoreSkill, OTHER_ABILITIES, TOOLS, ToolEntry } from '../../data/config';

@Component({
  selector: 'app-skills',
  standalone: true,
  imports: [ScrollRevealDirective, ScrollSceneDirective, Img, SplitTextDirective],
  templateUrl: './skills.html',
  styleUrl: './skills.scss',
})
export class Skills {
  readonly coreSkills: CoreSkill[] = CORE_SKILLS;
  readonly otherAbilities: string[] = OTHER_ABILITIES;
  readonly tools: ToolEntry[] = TOOLS;
}
