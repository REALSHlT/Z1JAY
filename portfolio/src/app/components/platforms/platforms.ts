import { Component, inject } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ScrollRevealDirective } from '../../directives/scroll-reveal.directive';

@Component({
  selector: 'app-platforms',
  standalone: true,
  imports: [ScrollRevealDirective],
  templateUrl: './platforms.html',
  styleUrl: './platforms.scss',
})
export class Platforms {
  readonly sketchfabModelUrl: SafeResourceUrl;
  readonly webPhotoUrl: SafeResourceUrl;

  constructor() {
    const sanitizer = inject(DomSanitizer);
    this.sketchfabModelUrl = sanitizer.bypassSecurityTrustResourceUrl(
      'https://sketchfab.com/models/193ce9edac9c4576a6131ff7d588ec2b/embed'
    );
    this.webPhotoUrl = sanitizer.bypassSecurityTrustResourceUrl(
      'https://imtdgo.github.io/WebPhoto'
    );
  }
}
