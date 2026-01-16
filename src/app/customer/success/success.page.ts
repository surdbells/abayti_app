import { Component, OnInit } from '@angular/core';

import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent, IonCol,
  IonContent, IonFooter, IonGrid,
  IonHeader, IonIcon, IonImg, IonRow, IonTabBar, IonTabButton,
  IonTitle,
  IonToolbar
} from '@ionic/angular/standalone';
import {TuiButton, TuiIcon} from "@taiga-ui/core";
import {RouterLink} from "@angular/router";
import {TranslatePipe} from "../../translate.pipe";

@Component({
  selector: 'app-success',
  templateUrl: './success.page.html',
  styleUrls: ['./success.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, FormsModule, IonButtons, IonCard, IonCardContent, IonFooter, IonIcon, IonTabBar, IonTabButton, TuiButton, TuiIcon, RouterLink, IonGrid, IonRow, IonCol, IonButton, IonImg, TranslatePipe]
})
export class SuccessPage implements OnInit {
  constructor() { }
  ngOnInit() {}
}
