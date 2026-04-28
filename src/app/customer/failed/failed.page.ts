import { Component, OnInit } from '@angular/core';

import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonContent
} from '@ionic/angular/standalone';
import {RouterLink} from "@angular/router";
import {TranslatePipe} from "../../translate.pipe";

@Component({
  selector: 'app-failed',
  templateUrl: './failed.page.html',
  styleUrls: ['./failed.page.scss'],
  standalone: true,
  imports: [IonContent, FormsModule, IonCard, IonCardHeader, IonCardTitle, IonButton, RouterLink, TranslatePipe]
})
export class FailedPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
