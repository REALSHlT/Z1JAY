import { Component } from '@angular/core';
import { LINKS, NAV_SECTIONS, NavSection } from '../../data/config';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
})
export class Footer {
  readonly links = LINKS;
  readonly sections: NavSection[] = NAV_SECTIONS;
  /** 版權年份自動更新，免得又變成寫死的過期年份 */
  readonly year = new Date().getFullYear();
}
