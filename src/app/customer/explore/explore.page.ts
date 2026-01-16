import { Component,CUSTOM_ELEMENTS_SCHEMA , OnInit } from '@angular/core';
import {IonicModule, Platform, ToastController} from '@ionic/angular';
import {Products} from "../../class/products";
import {Labels} from "../../class/labels";
import {GlobalComponent} from "../../global-component";
import {NavController} from "@ionic/angular/standalone";
import {ConnectionService} from "../../service/connection.service";
import {Router} from "@angular/router";
import {NetworkService} from "../../service/network.service";
import {HotToastService} from "@ngxpert/hot-toast";

@Component({
  selector: 'app-explore',
  templateUrl: './explore.page.html',
  styleUrls: ['./explore.page.scss'],
   schemas: [CUSTOM_ELEMENTS_SCHEMA],
  standalone: true,
  imports: [IonicModule]
})
export class ExplorePage implements OnInit {
  products: Products[] = [];
  categories: Labels[] = [];
  constructor(
    private nav: NavController,
    private net: ConnectionService,
    private toastController: ToastController,
    private platform: Platform,
    private router: Router,
    private networkService: NetworkService,
    private toast: HotToastService,
  ) { }
  ui_controls = {
    is_loading: false,
    is_loaded: false,
    is_empty: false,
    is_loading_category: false
  }
  explore = {
    id: 0,
    token: "",
    limit: 100,
    offset: 0
  }
  single_user = {
    id: 0,
    token: "",
    first_name: "",
    last_name: "",
    user_type: "",
    email: "",
    phone: "",
    avatar: "",
    location: "",
    is_2fa: false,
    is_active: false,
    is_admin: false,
    is_vendor: false,
    is_customer: false
  }
  ngOnInit() {

  }
  images: string[] = [
    'https://picsum.photos/800/1600?1',
    'https://picsum.photos/800/1600?2',
    'https://picsum.photos/800/1600?3',
    'https://picsum.photos/800/1600?4'
  ];

  explore_products() {
    this.products = [];
    this.ui_controls.is_loading = true;
    this.ui_controls.is_loaded = false;
    this.ui_controls.is_empty = false;
    this.explore.id = this.single_user.id;
    this.explore.token = this.single_user.token;

    this.networkService.post_request(this.explore, GlobalComponent.explore_listing)
      .subscribe({
        next: (response) => {
          if (response.response_code === 200 && response.status === "success") {
            this.products = response.data;
            this.ui_controls.is_loading = false;
            this.ui_controls.is_loaded = true;
            this.ui_controls.is_empty = false;
          //  this.activeImageIndices.clear();
           // this.imageLoaded = {};
           // setTimeout(() => this.initializeSwipers(), 100);
          } else {
            this.ui_controls.is_loading = false;
            this.ui_controls.is_empty = true;
          }
        }
      });
  }
  getMoreItems() {
    this.ui_controls.is_loading = true;
    this.explore.id = this.single_user.id;
    this.explore.token = this.single_user.token;
    this.explore.offset = this.explore.offset + this.explore.limit
    this.networkService.post_request(this.explore, GlobalComponent.explore_listing)
      .subscribe(({
        next: (response) => {
          if (response.response_code === 200 && response.status === "success") {
            this.products.push(...response.data);
            if (response.data.length < this.explore.limit) {
              this.ui_controls.is_empty = true;
            }
          }else {
            this.ui_controls.is_empty = true;
          }
        },
        error: (err) => {
          console.error('Pagination request failed:', err);
          this.ui_controls.is_empty = true;
        },
        complete: () => {
          this.ui_controls.is_loading = false;
        }
      }))
  }
}
