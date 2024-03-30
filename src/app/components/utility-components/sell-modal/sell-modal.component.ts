import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PortfolioService } from '../../../core/services/portfolio.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-sell-modal',
  standalone: true,
  imports: [NgbModule, CommonModule, FormsModule],
  templateUrl: './sell-modal.component.html',
  styleUrl: './sell-modal.component.css',
})
export class StockSellModalComponent {
  @Input() stocksymbol!: string;
  @Input() currentPrice!: number;
  // @Input() moneyInWallet!: number;
  @Input() currentPortfolioData: any;
  quantity: number = 0;
  oldWalletMoney: any;
  stockPresentInPortfolio: boolean = false;
  stockIndexInPortfolio: number = -1;
  private walletSubscription!: Subscription;
  canSell: boolean = false;

  constructor(
    public activeModal: NgbActiveModal,
    private portfolioService: PortfolioService
  ) {}

  ngOnInit(): void {
    this.walletSubscription = this.portfolioService.walletMoney.subscribe({
      next: (money) => {
        this.oldWalletMoney = money;
        console.log(
          'Wallet Money Updated in buy component:',
          this.oldWalletMoney
        );
      },
      error: (error) => {
        console.error('Error subscribing to walletMoney:', error);
      },
      complete: () => {
        console.log('Completed wallet money subscription.');
      },
    });
    console.log('Modal initialized');
    if (this.stocksymbol && this.currentPrice) {
      console.log('Stock Symbol:', this.stocksymbol);
      console.log('Current Price:', this.currentPrice);
      // console.log('Money in Wallet:', this.moneyInWallet);
      // this.oldWalletMoney = this.moneyInWallet;
      this.currentPortfolioData.some((entry: any) => {
        if (
          entry.stocksymbol.toUpperCase() === this.stocksymbol.toUpperCase()
        ) {
          this.stockPresentInPortfolio = true;
          this.stockIndexInPortfolio = this.currentPortfolioData.indexOf(entry);
        }
      });
    }
    if (this.stocksymbol && this.currentPrice) {
      this.sellValidation(); // Initial validation
    }
  }

  sellValidation(): void {
    const portfolioEntry = this.currentPortfolioData.find(
      (entry: any) =>
        entry.stocksymbol.toUpperCase() === this.stocksymbol.toUpperCase()
    );
    this.canSell =
      portfolioEntry &&
      this.quantity > 0 &&
      this.quantity <= portfolioEntry.quantity;
  }

  sellStock(): void {
    console.log('Selling stock');
    console.log(
      'Current Portfolio Data on sell stock:',
      this.currentPortfolioData
    );

    if (
      this.currentPortfolioData[this.stockIndexInPortfolio].quantity ==
      this.quantity
    ) {
      console.log('Selling stock');
      this.portfolioService.removePortfolioRecord(this.stocksymbol).subscribe({
        next: (data) => {
          console.log('Stock sold');
          this.currentPortfolioData = data;
          this.stockIndexInPortfolio = -1;
          this.stockPresentInPortfolio = false;
        },
        error: (error) => {
          console.error('Error selling stock:', error);
        },
      });
    } else if (
      this.currentPortfolioData[this.stockIndexInPortfolio].quantity >
      this.quantity
    ) {
      let totalquantityafterbuy =
        this.currentPortfolioData[this.stockIndexInPortfolio].quantity -
        this.quantity;
      let totalcostafterbuy = parseFloat(
        Number(
          this.currentPortfolioData[this.stockIndexInPortfolio].cost -
            this.quantity * this.currentPrice
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
            console.log('Stock sold');
            this.currentPortfolioData = data;
            this.stockIndexInPortfolio = -1;
            this.stockPresentInPortfolio = false;
            //TODO: update wallet
          },
          error: (error) => {
            console.error('Error selling stock:', error);
          },
        });
    }

    const totalRevenue = this.getTotal();
    this.portfolioService.updateWalletMoney(totalRevenue);

    this.activeModal.close();
  }

  getTotal(): number {
    return parseFloat(Number(this.quantity * this.currentPrice).toFixed(2));
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
