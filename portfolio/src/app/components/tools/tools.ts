import { Component } from '@angular/core';
import { ScrollRevealDirective } from '../../directives/scroll-reveal.directive';
import { INTEGRATIONS, INTEGRATION_NOTE, Integration, TOOL_PROJECTS, ToolProject } from '../../data/config';

@Component({
  selector: 'app-tools',
  standalone: true,
  imports: [ScrollRevealDirective],
  templateUrl: './tools.html',
  styleUrl: './tools.scss',
})
export class Tools {
  readonly toolProjects: ToolProject[] = TOOL_PROJECTS;
  readonly integrations: Integration[] = INTEGRATIONS;
  readonly integrationNote = INTEGRATION_NOTE;
}
