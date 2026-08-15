import { Component } from '@angular/core';
import { ScrollRevealDirective } from '../../directives/scroll-reveal.directive';
import { SplitTextDirective } from '../../directives/split-text.directive';
import { Img } from '../shared/img';
import {
  EARLY_WORKS, EARLY_WORKS_NOTE, EarlyWork,
  PROJECTS, ProjectEntry, TGT_COMPARISON, TGT_STILLS, Still,
} from '../../data/config';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [ScrollRevealDirective, Img, SplitTextDirective],
  templateUrl: './projects.html',
  styleUrl: './projects.scss',
})
export class Projects {
  /** 《The Gentle Trigger》單獨拉出來做主打案例，其餘走卡片列表 */
  readonly featured: ProjectEntry = PROJECTS[0];
  readonly projects: ProjectEntry[] = PROJECTS.slice(1);

  readonly stills: Still[] = TGT_STILLS;
  readonly comparison = TGT_COMPARISON;

  readonly earlyWorks: EarlyWork[] = EARLY_WORKS;
  readonly earlyNote = EARLY_WORKS_NOTE;

  readonly tints = ['panel-tint-1', 'panel-tint-2', 'panel-tint-3', 'panel-tint-0'];
  readonly bursts = ['POW!', 'BAM!', 'ZAP!', 'BOOM!'];
}
