import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';

@Component({
  selector: 'app-explore',
  templateUrl: './explore.page.html',
  styleUrls: ['./explore.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
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
