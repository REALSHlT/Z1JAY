import { Component } from '@angular/core';
import { Nav } from './components/nav/nav';
import { Hero } from './components/hero/hero';
import { Skills } from './components/skills/skills';
import { Projects } from './components/projects/projects';
import { Platforms } from './components/platforms/platforms';
import { Experience } from './components/experience/experience';
import { AiLab } from './components/ai-lab/ai-lab';
import { Certifications } from './components/certifications/certifications';
import { Contact } from './components/contact/contact';
import { Footer } from './components/footer/footer';
import { CertModal } from './components/cert-modal/cert-modal';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    Nav,
    Hero,
    Skills,
    Projects,
    Platforms,
    Experience,
    AiLab,
    Certifications,
    Contact,
    Footer,
    CertModal,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
