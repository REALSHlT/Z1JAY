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
  /** 漫畫狀聲詞 + 分格底色，依序對應每個作品 */
  readonly bursts = ['BANG!', 'RUN!', 'PLAY!', 'VR!'];
  readonly tints = ['bg-white', 'bg-[#fff6d6]', 'bg-[#eef2ff]', 'bg-[#ffefe9]'];
}
