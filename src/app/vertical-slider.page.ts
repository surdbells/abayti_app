import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { SwiperModule } from 'swiper/angular';
import SwiperCore, { Mousewheel } from 'swiper';

SwiperCore.use([Mousewheel]);

@Component({
  selector: 'app-vertical-slider',
  standalone: true,
  imports: [IonicModule, SwiperModule],
  templateUrl: './vertical-slider.page.html',
  styleUrls: ['./vertical-slider.page.scss']
})
export class VerticalSliderPage {

  images: string[] = [
    'https://picsum.photos/800/1600?1',
    'https://picsum.photos/800/1600?2',
    'https://picsum.photos/800/1600?3',
    'https://picsum.photos/800/1600?4'
  ];

}
