import { Component } from '@angular/core';
import { NgClass } from '@angular/common';
import { ScrollRevealDirective } from '../../directives/scroll-reveal.directive';
import { PROJECTS, ProjectEntry } from '../../data/config';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [NgClass, ScrollRevealDirective],
  templateUrl: './projects.html',
  styleUrl: './projects.scss',
})
export class Projects {
  readonly projects: ProjectEntry[] = PROJECTS;
}
