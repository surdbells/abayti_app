import {Component, CUSTOM_ELEMENTS_SCHEMA, Input} from '@angular/core';
import { ModalController } from '@ionic/angular';
import {
  IonButton,
  IonButtons, IonCheckbox,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel, IonSelect,
  IonSelectOption,
  IonTitle,
  IonToolbar
} from "@ionic/angular/standalone";

import {FormsModule} from "@angular/forms";
export interface Product {
  id: number;
  name: string;
  image: string;
  store: string;
  selected?: boolean;
}
@Component({
  selector: 'app-select-products',
  templateUrl: './select-products.component.html',
  styleUrls: ['./select-products.component.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonContent,
    IonItem,
    IonLabel,
    IonSelectOption,
    IonSelect,
    IonCheckbox,
    FormsModule,
    IonButton
],
  schemas:[CUSTOM_ELEMENTS_SCHEMA],
  standalone: true
})
export class SelectProductsComponent {
  @Input() products: Product[] = [];
  @Input() wishlistProducts: Product[] = [];

  filteredProducts: Product[] = [];
  stores: string[] = [];
  selectedStore: string | null = null;
  selectedWishlistProducts: Product[] = [];

  constructor(private modalCtrl: ModalController) {}

  ngOnInit() {
    this.filteredProducts = [...this.products];
    this.stores = Array.from(new Set(this.products.map(p => p.store)));
  }

  closeModal() {
    this.modalCtrl.dismiss(this.products.filter(p => p.selected)).then(r => console.log(r));
  }

  filterProducts() {
    if (this.selectedStore) {
      this.filteredProducts = this.products.filter(p => p.store === this.selectedStore);
    } else {
      this.filteredProducts = [...this.products];
    }
  }

  toggleSelect(product: Product) {
    product.selected = !product.selected;
  }

  addWishlistProducts() {
    for (let item of this.selectedWishlistProducts) {
      const existing = this.products.find(p => p.id === item.id);
      if (!existing) {
        this.products.push({ ...item, selected: true });
      } else {
        existing.selected = true;
      }
    }
    this.filterProducts();
    this.selectedWishlistProducts = [];
  }
}
