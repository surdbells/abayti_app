import { Component, OnInit } from '@angular/core';

import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonCard,
  IonCardContent, IonCol,
  IonContent, IonGrid,
  IonImg, IonRow
} from '@ionic/angular/standalone';
import {RouterLink} from "@angular/router";
import {TranslatePipe} from "../../translate.pipe";

import { AxIconComponent } from '../../shared/ax-mobile/icon';
@Component({
  selector: 'app-success',
  templateUrl: './success.page.html',
  styleUrls: ['./success.page.scss'],
  standalone: true,
  imports: [IonContent, FormsModule, IonCard, IonCardContent, RouterLink, IonGrid, IonRow, IonCol, IonButton, IonImg, TranslatePipe, AxIconComponent]
})
export class SuccessPage implements OnInit {
  constructor() { }
  ngOnInit() {}
}
