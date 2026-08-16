import { Component } from '@angular/core';
import { ScrollRevealDirective } from '../../directives/scroll-reveal.directive';
import { ScrollSceneDirective } from '../../directives/scroll-scene.directive';
import { SplitTextDirective } from '../../directives/split-text.directive';
import { ABOUT_INTRO, STORY, StoryBlock } from '../../data/config';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [ScrollRevealDirective, ScrollSceneDirective, SplitTextDirective],
  templateUrl: './about.html',
  styleUrl: './about.scss',
})
export class About {
  readonly intro = ABOUT_INTRO;
  readonly story: StoryBlock[] = STORY;
}
