import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { forkJoin, Subscription } from 'rxjs';
import { PortfolioService } from '../../core/services/portfolio.service';
import { StockSearchService } from '../../core/services/stock-search.service';
import { StockBuyModalComponent } from '../utility-components/buy-modal/buy-modal.component';
import { StockSellModalComponent } from '../utility-components/sell-modal/sell-modal.component';

@Component({
  selector: 'app-portfolio',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './portfolio.component.html',
  styleUrl: './portfolio.component.css',
})
export class PortfolioComponent implements OnInit {
  portfolio: any = [];
  // walletMoney = 25000000;
  stocks: any = [];
  isEmpty: boolean = false;
  isLoading: boolean = false;
  displayData: CardRecord[] = [];
  displayBuyAlert = false;
  displaySellAlert = false;
  symbolBought: any;
  symbolSold: any;
  oldWalletMoney: any;
  private walletSubscription!: Subscription;

  private baseUrl = 'http://localhost:8000/api';
  constructor(
    private portfolioService: PortfolioService,
    private stockSearchService: StockSearchService,
    private http: HttpClient,
    private modalService: NgbModal
  ) {}

  ngOnInit() {
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
    this.loadPortfolio();
  }

  loadPortfolio(): void {
    this.displayData = [];
    let companyInfoData: any;
    let stockPriceDetailsData: any;
    this.isLoading = true;
    this.portfolioService.getPortfolio().subscribe({
      next: (data) => {
        if (data.length > 0) {
          this.portfolio = data;
          // console.log('Portfolio loaded:', data);
          if (this.portfolio.length == 0) {
            this.isEmpty = true;
          } else {
            this.isEmpty = false;
            for (let i = 0; i < this.portfolio.length; i++) {
              const companyInfo = this.http.get(
                `${this.baseUrl}/company?symbol=${encodeURIComponent(
                  this.portfolio[i].stocksymbol
                )}`
              );
              const stockPriceDetails = this.http.get(
                `${this.baseUrl}/latestPrice?symbol=${encodeURIComponent(
                  this.portfolio[i].stocksymbol
                )}`
              );
              forkJoin({ companyInfo, stockPriceDetails }).subscribe({
                next: (response) => {
                  companyInfoData = response.companyInfo;
                  stockPriceDetailsData = response.stockPriceDetails;
                  // console.log('Company Info:', companyInfoData);
                  // console.log('Stock Price Details:', stockPriceDetailsData);
                  let currentprice = parseFloat(
                    stockPriceDetailsData.c.toFixed(2)
                  );
                  // console.log('currentprice:', currentprice);
                  let totalcostinportfolio = parseFloat(
                    Number(this.portfolio[i].cost).toFixed(2)
                  );
                  // console.log('totalcostinportfolio:', totalcostinportfolio);
                  let totalStocks = parseFloat(
                    Number(this.portfolio[i].quantity).toFixed(2)
                  );
                  // console.log('Total Stocks:', totalStocks);
                  let averagecostcurrent = totalcostinportfolio / totalStocks;
                  let changeDirection = currentprice - averagecostcurrent;
                  // console.log('averagecostcurrent:', averagecostcurrent);
                  let arrowDirection =
                    currentprice - parseFloat(changeDirection.toFixed(2));
                  // console.log('Arrow Direction:', arrowDirection);
                  let arrow: any;
                  let arrowcolor: any;
                  if (arrowDirection < 0) {
                    arrow = 'bi-caret-down-fill';
                    arrowcolor = { color: 'red' };
                  } else if (arrowDirection > 0) {
                    arrow = 'bi-caret-up-fill';
                    arrowcolor = { color: 'green' };
                  } else {
                    arrow = '';
                    arrowcolor = { color: 'black' };
                  }
                  // console.log('Arrow:', arrow);
                  // console.log('Arrow Color:', arrowcolor);
                  let cardItem: CardRecord = {
                    stocksymbol: this.portfolio[i].stocksymbol,
                    companyName: companyInfoData.name,
                    stockquantity: this.portfolio[i].quantity,
                    averagecost: averagecostcurrent,
                    currentprice: currentprice,
                    change: arrowDirection,
                    marketvalue: parseFloat(
                      Number(totalStocks * currentprice).toFixed(2)
                    ),
                    arrow: arrow,
                    arrowcolor: arrowcolor,
                    totalcost: this.portfolio[i].cost,
                  };
                  // console.log('Card Item:', cardItem);
                  this.displayData.push(cardItem);
                  this.isLoading = false;
                  // console.log('Display Data:', this.displayData);
                },
                error: (error) => {
                  console.error(
                    'There was an error loading the portfolio',
                    error
                  );
                },
              });
              this.stocks.push(this.portfolio[i].stocksymbol);
            }
          }
        } else {
          this.isEmpty = true;
          this.isLoading = false;
        }
      },
      error: (error) => {
        console.error('There was an error loading the portfolio', error);
      },
    });
    // this.isLoading = false;
  }

  openBuyModal(stocksymbol: any, currentPrice: any): void {
    this.displayBuyAlert = false;
    this.displaySellAlert = false;
    const buyModalReference = this.modalService.open(StockBuyModalComponent);
    buyModalReference.componentInstance.stocksymbol = stocksymbol;
    buyModalReference.componentInstance.currentPrice = currentPrice;
    // buyModalReference.componentInstance.moneyInWallet = this.oldWalletMoney;
    buyModalReference.componentInstance.currentPortfolioData = this.portfolio;
    buyModalReference.result.then((result) => {
      this.displayBuyAlert = true;
      this.symbolBought = stocksymbol;
      // setTimeout(() => {
      //   this.displayBuyAlert = false;
      // }, 3000);
      this.loadPortfolio();
    });
  }

  openSellModal(stocksymbol: any, currentPrice: any) {
    this.displayBuyAlert = false;
    this.displaySellAlert = false;
    const sellModalReference = this.modalService.open(StockSellModalComponent);
    sellModalReference.componentInstance.stocksymbol = stocksymbol;
    // sellModalReference.componentInstance.moneyInWallet = this.oldWalletMoney;
    sellModalReference.componentInstance.currentPrice = currentPrice;
    sellModalReference.componentInstance.currentPortfolioData = this.portfolio;
    sellModalReference.result.then((result) => {
      this.displaySellAlert = true;
      this.symbolSold = stocksymbol;
      // setTimeout(() => {
      //   this.displaySellAlert = false;
      // }, 3000);
      this.loadPortfolio();
    });
  }

  addRecord(symbol: string, quantity: number, price: number): void {
    this.portfolioService
      .addPortfolioRecord(symbol, quantity, price)
      .subscribe({
        next: (data) => {
          this.portfolio = data;
        },
        error: (error) => {
          console.error('There was an error adding the record', error);
        },
      });
  }

  removeRecord(symbol: string): void {
    this.portfolioService.removePortfolioRecord(symbol).subscribe({
      next: (data) => {
        this.portfolio = data;
      },
      error: (error) => {
        console.error('There was an error removing the record', error);
      },
    });
  }

  updateRecord(symbol: string, quantity: number, price: number): void {
    this.portfolioService
      .updatePortfolioRecord(symbol, quantity, price)
      .subscribe({
        next: (data) => {
          this.portfolio = data;
        },
        error: (error) => {
          console.error('There was an error updating the record', error);
        },
      });
  }

  ngOnDestroy(): void {
    if (this.walletSubscription) {
      this.walletSubscription.unsubscribe();
    }
  }
}

interface CardRecord {
  stocksymbol: string;
  companyName: string;
  stockquantity: number;
  averagecost: number;
  currentprice: number;
  change: number;
  marketvalue: number;
  arrow: string;
  arrowcolor: any;
  totalcost: number;
}
