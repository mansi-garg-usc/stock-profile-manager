import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
@Component({
  selector: 'app-buy-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './buy-modal.component.html',
  styleUrl: './buy-modal.component.css',
})
export class StockBuyModalComponent {
  @Input() ticker!: string;
  @Input() currentPrice!: number;
  @Input() moneyInWallet!: number;
  quantity: number = 0;

  constructor(public activeModal: NgbActiveModal) {}

  getTotal(): number {
    return this.quantity * this.currentPrice;
  }

  buyStock(): void {
    // Implement your buy logic here
    console.log('Buying stock');
    // Close the modal after buying
    this.activeModal.close();
  }

  dismiss(): void {
    this.activeModal.dismiss();
  }
}
