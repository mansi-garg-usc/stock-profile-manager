import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { PortfolioService } from '../../../core/services/portfolio.service';
import { Subscription } from 'rxjs';
@Component({
  selector: 'app-buy-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './buy-modal.component.html',
  styleUrl: './buy-modal.component.css',
})
export class StockBuyModalComponent {
  @Input() stocksymbol!: string;
  @Input() currentPrice!: number;
  @Input() currentPortfolioData: any;
  @Input() stockPresentInPortfolio: boolean = false;
  @Input() stockIndexInPortfolio: number = -1;
  oldWalletMoney: any = 0;
  quantity: number = 0;
  private walletSubscription!: Subscription;
  notEnoughMoneyError: boolean = false;

  constructor(
    public activeModal: NgbActiveModal,
    private portfolioService: PortfolioService
  ) {}

  ngOnInit(): void {
    this.walletSubscription = this.portfolioService.walletMoney.subscribe({
      next: (money) => {
        this.oldWalletMoney = money;
        // console.log(
        //   'Wallet Money Updated in buy component:',
        //   this.oldWalletMoney
        // );
      },
      error: (error) => {
        console.error('Error subscribing to walletMoney:', error);
      },
      complete: () => {
        console.log('Completed wallet money subscription.');
      },
    });
    console.log('Modal initialized');
    if (this.stocksymbol && this.currentPrice && this.oldWalletMoney) {
      // console.log('Stock Symbol:', this.stocksymbol);
      // console.log('Current Price:', this.currentPrice);
      // console.log('Money in Wallet:', this.oldWalletMoney);

      this.currentPortfolioData?.some((entry: any) => {
        if (
          entry.stocksymbol.toUpperCase() === this.stocksymbol.toUpperCase()
        ) {
          this.stockPresentInPortfolio = true;
          this.stockIndexInPortfolio = this.currentPortfolioData.indexOf(entry);
        }
      });
    }
  }

  getTotal(): number {
    return parseFloat(Number(this.quantity * this.currentPrice).toFixed(2));
  }

  checkFunds(): void {
    this.notEnoughMoneyError = this.getTotal() > this.oldWalletMoney;
  }

  buyStock(): void {
    // console.log('Buying stock');
    if (!this.notEnoughMoneyError) {
      if (this.stockPresentInPortfolio) {
        let totalquantityafterbuy =
          Number(
            this.currentPortfolioData[this.stockIndexInPortfolio].quantity
          ) + Number(this.quantity);
        let totalcostafterbuy = parseFloat(
          Number(
            Number(this.currentPortfolioData[this.stockIndexInPortfolio].cost) +
              Number(Number(this.quantity) * Number(this.currentPrice))
          ).toFixed(2)
        );

        this.portfolioService
          .updatePortfolioRecord(
            this.stocksymbol,
            totalquantityafterbuy,
            totalcostafterbuy
          )
          .subscribe({
            next: (data) => {
              this.currentPortfolioData = data;
              // console.log('Portfolio updated:', data);
              this.stockIndexInPortfolio = -1;
              this.stockPresentInPortfolio = false;
              this.activeModal.close(data);

              const totalCost = this.getTotal();
              this.portfolioService.updateWalletMoney(-totalCost);
              //TODO: update wallet
            },
            error: (error) => {
              console.error('Error updating portfolio:', error);
            },
          });
      } else {
        let updatedTotalCost = parseFloat(
          (Number(this.currentPrice) * Number(this.quantity)).toFixed(2)
        );
        this.portfolioService
          .addPortfolioRecord(this.stocksymbol, this.quantity, updatedTotalCost)
          .subscribe({
            next: (data) => {
              this.currentPortfolioData = data;
              this.stockIndexInPortfolio = -1;
              this.stockPresentInPortfolio = false;
              // console.log('Portfolio updated:', data);
              //TODO: update wallet
              this.activeModal.close(data);

              const totalCost = this.getTotal();
              this.portfolioService.updateWalletMoney(-totalCost);
            },
            error: (error) => {
              console.error('Error updating portfolio:', error);
            },
          });
      }

      // Close the modal after buying
    }
  }

  dismiss(): void {
    this.activeModal.dismiss();
  }

  ngOnDestroy(): void {
    if (this.walletSubscription) {
      this.walletSubscription.unsubscribe();
    }
  }
}
