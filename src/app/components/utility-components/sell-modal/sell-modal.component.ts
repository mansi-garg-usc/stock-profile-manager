import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-sell-modal',
  standalone: true,
  imports: [NgbModule, CommonModule, FormsModule],
  templateUrl: './sell-modal.component.html',
  styleUrl: './sell-modal.component.css',
})
export class StockSellModalComponent {
  @Input() ticker!: string;
  @Input() currentPrice!: number;
  quantity: number = 0;

  constructor(public activeModal: NgbActiveModal) {}

  getTotal(): number {
    return this.quantity * this.currentPrice;
  }

  sellStock(): void {
    // Implement your sell logic here
    console.log('Selling stock');
    this.activeModal.close();
  }

  dismiss(): void {
    this.activeModal.dismiss();
  }
}
