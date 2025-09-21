import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent, IonCol,
  IonContent, IonFooter, IonGrid,
  IonHeader, IonIcon, IonRow, IonTabBar, IonTabButton,
  IonTitle,
  IonToolbar
} from '@ionic/angular/standalone';
import {TuiButton, TuiIcon} from "@taiga-ui/core";
import {RouterLink} from "@angular/router";

@Component({
  selector: 'app-success',
  templateUrl: './success.page.html',
  styleUrls: ['./success.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonButtons, IonCard, IonCardContent, IonFooter, IonIcon, IonTabBar, IonTabButton, TuiButton, TuiIcon, RouterLink, IonGrid, IonRow, IonCol, IonButton]
})
export class SuccessPage implements OnInit {

  constructor() { }

  ngOnInit() {}
  ui_controls = {
    confirming_transaction: true,
    isConfirmed: false
  }
}
