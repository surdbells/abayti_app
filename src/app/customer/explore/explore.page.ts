import { Component,CUSTOM_ELEMENTS_SCHEMA , OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-explore',
  templateUrl: './explore.page.html',
  styleUrls: ['./explore.page.scss'],
   schemas: [CUSTOM_ELEMENTS_SCHEMA],
  standalone: true,
  imports: [IonicModule]
})
export class ExplorePage implements OnInit {

  constructor() { }

  ngOnInit() {
  }
  images: string[] = [
    'https://picsum.photos/800/1600?1',
    'https://picsum.photos/800/1600?2',
    'https://picsum.photos/800/1600?3',
    'https://picsum.photos/800/1600?4'
  ];
}
