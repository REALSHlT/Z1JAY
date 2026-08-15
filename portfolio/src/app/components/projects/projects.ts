import { Component } from '@angular/core';
import { ScrollRevealDirective } from '../../directives/scroll-reveal.directive';
import { Img } from '../shared/img';
import { PROJECTS, ProjectEntry, TGT_COMPARISON, TGT_STILLS, Still } from '../../data/config';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [ScrollRevealDirective, Img],
  templateUrl: './projects.html',
  styleUrl: './projects.scss',
})
export class Projects {
  /** 《The Gentle Trigger》單獨拉出來做主打案例，其餘走卡片列表 */
  readonly featured: ProjectEntry = PROJECTS[0];
  readonly projects: ProjectEntry[] = PROJECTS.slice(1);

  readonly stills: Still[] = TGT_STILLS;
  readonly comparison = TGT_COMPARISON;

  readonly tints = ['panel-tint-1', 'panel-tint-2', 'panel-tint-3', 'panel-tint-0'];
  readonly bursts = ['POW!', 'BAM!', 'ZAP!', 'BOOM!'];
}
