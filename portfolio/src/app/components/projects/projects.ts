import { Component } from '@angular/core';
import { ScrollRevealDirective } from '../../directives/scroll-reveal.directive';
import { PROJECTS, ProjectEntry } from '../../data/config';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [ScrollRevealDirective],
  templateUrl: './projects.html',
  styleUrl: './projects.scss',
})
export class Projects {
  readonly projects: ProjectEntry[] = PROJECTS;
  /** 漫畫狀聲詞 + 分格底色（跟隨動態主題），依序對應每個作品 */
  readonly bursts = ['BANG!', 'RUN!', 'PLAY!', 'VR!'];
  readonly tints = ['panel-tint-0', 'panel-tint-1', 'panel-tint-2', 'panel-tint-3'];
}
