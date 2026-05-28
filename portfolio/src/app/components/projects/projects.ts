import { Component } from '@angular/core';
import { NgClass } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ScrollRevealDirective } from '../../directives/scroll-reveal.directive';
import { PROJECTS, LINKS, ProjectEntry } from '../../data/config';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [NgClass, ScrollRevealDirective],
  templateUrl: './projects.html',
  styleUrl: './projects.scss',
})
export class Projects {
  readonly projects: ProjectEntry[] = PROJECTS;
  readonly modelEmbedUrl: SafeResourceUrl;

  constructor(sanitizer: DomSanitizer) {
    this.modelEmbedUrl = sanitizer.bypassSecurityTrustResourceUrl(
      LINKS.platforms.sketchfabModel
    );
  }
}
