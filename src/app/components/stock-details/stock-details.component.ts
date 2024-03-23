import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, of, Subscription, switchMap } from 'rxjs';
import { StockSearchService } from '../../core/services/stock-search.service';
import { TabsComponent } from '../tabs/tabs.component';
import { SimpleChanges } from '@angular/core';
import { StockBuyModalComponent } from '../utility-components/buy-modal/buy-modal.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { StockSellModalComponent } from '../utility-components/sell-modal/sell-modal.component';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-stock-details',
  templateUrl: './stock-details.component.html',
  styleUrls: ['./stock-details.component.css'],
  standalone: true,
  imports: [CommonModule, TabsComponent, StockBuyModalComponent],
})
export class StockDetailsComponent implements OnInit, OnDestroy {
  @Input() stockInfo: any;
  @Input() stockSymbol: string = '';
  @Input() searchStock: any;

  isMarketOpen = new BehaviorSubject<boolean>(false);
  private stockInfoSubject = new BehaviorSubject<any>(null);
  private time: any;
  changePercentage: string = '';
  // direction = true means increase, false means decrease
  direction: boolean = false;
  dateTimestamp: any;
  marketStatusString: string = '';
  isFavorite: boolean = false;

  public showTabs: boolean = false;
  private subscription: Subscription = new Subscription();
  moneyInWallet: number = 10000000; //TODO

  constructor(
    private stockSearchService: StockSearchService,
    private activatedRoute: ActivatedRoute,
    private modalService: NgbModal
  ) {}
  // buyModalService: NgbModal = new NgbModal();

  ngOnInit() {
    this.subscription = this.stockSearchService.exposedSearchResult.subscribe({
      next: (results) => {
        if (results && results.length > 0) {
          this.handleSearchResults(results);
        }
        console.log('search stock function', this.searchStock);
      },
      error: (error) =>
        console.error('Error while fetching stock details:', error),
    });

    this.subscription.add(
      this.activatedRoute.params
        .pipe(
          switchMap((params) => {
            const ticker = params['ticker'];
            if (ticker) {
              return this.stockSearchService.searchStock(ticker); // Ensure searchStock returns an Observable
            }
            return of({});
          })
        )
        .subscribe((results) => {
          if (results && Object.keys(results).length > 0) {
            this.handleSearchResults(results);
          }
        })
    );
  }

  handleSearchResults(results: any) {
    if (results && results.length > 0) {
      this.stockInfo = results;
      this.setMarketStatus();
      this.checkChangePercentage(this.stockInfo.stockPriceDetails.dp);
      this.dateTimestamp = this.formatDate(this.stockInfo.stockPriceDetails.t);
      this.marketStatusString = this.isMarketOpen.value
        ? 'Market is Open'
        : 'Market is Closed';
      this.showTabs = true;
      this.stockInfoSubject.next(this.stockInfo);
      console.log('Stock stockInfoSubject:', this.stockInfoSubject);
      console.log('show tabs', this.showTabs);

      console.log('stock symbol:', this.stockSymbol);
      this.stockSearchService.startPeriodicUpdate(this.stockSymbol); // Adjust the property path as per your data structure
    }
  }

  openBuyModal() {
    const buyModalReference = this.modalService.open(StockBuyModalComponent);
    buyModalReference.componentInstance.ticker = this.stockSymbol;
    buyModalReference.componentInstance.currentPrice =
      this.stockInfo.stockPriceDetails.c;
    buyModalReference.componentInstance.moneyInWallet = this.moneyInWallet;
  }

  openSellModal() {
    const sellModalReference = this.modalService.open(StockSellModalComponent);
    sellModalReference.componentInstance.ticker = this.stockSymbol;
    sellModalReference.componentInstance.currentPrice =
      this.stockInfo.stockPriceDetails.c;
  }

  get stockInfo$() {
    return this.stockInfoSubject.asObservable();
  }

  get isMarketOpen$() {
    return this.isMarketOpen.asObservable();
  }

  ngOnChanges(changes: SimpleChanges) {
    this.stockInfoSubject.next(this.stockInfo);
    this.setMarketStatus();
    if (this.stockInfo.hasOwnProperty('companyInfo')) {
      this.checkChangePercentage(this.stockInfo.stockPriceDetails.dp);
      this.dateTimestamp = this.formatDate(this.stockInfo.stockPriceDetails.t);
      this.showTabs = true;
      this.marketStatusString = this.isMarketOpen.value
        ? 'Market is Open'
        : 'Market is Closed';
    }
    console.log('Is market open in ngOnChanges:', this.isMarketOpen.value);
    // React to changes in stockSymbol, especially for a new stock search
    if (changes['stockSymbol'] && this.stockSymbol && this.isMarketOpen.value) {
      this.stockSearchService.startPeriodicUpdate(this.stockSymbol);
      console.log('Periodic update started for symbol:', this.stockSymbol);
    }
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    this.stockSearchService.stopPeriodicUpdate();
  }

  checkChangePercentage(value: number) {
    if (value > 0) {
      this.direction = true;
      this.changePercentage = `(${value?.toFixed(2)} %)`;
    } else {
      this.direction = false;
      this.changePercentage = `(${value?.toFixed(2)} %)`;
    }
  }

  formatDate(unixTimeStamp: any) {
    const date = new Date(unixTimeStamp * 1000); // Convert to milliseconds
    const year = date.getUTCFullYear();
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0'); // Month is 0-indexed, add 1 to adjust
    const day = date.getUTCDate().toString().padStart(2, '0');
    const hours = date.getUTCHours().toString().padStart(2, '0');
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    const seconds = date.getUTCSeconds().toString().padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  setMarketStatus() {
    this.time = this.stockInfo?.stockPriceDetails?.t * 1000;
    let currentTime = new Date().getTime();
    let timeDiff = currentTime - this.time;
    let fiveMinutes = 5 * 60 * 1000;
    if (timeDiff < fiveMinutes) {
      this.isMarketOpen?.next(true);
    } else {
      this.isMarketOpen?.next(false);
    }
    console.log('Is market open:', this.isMarketOpen?.value);
  }

  toggleFavorite(): void {
    this.isFavorite = !this.isFavorite;
    console.log(`Favorite toggled: ${this.isFavorite ? 'Filled' : 'Unfilled'}`);
  }
}
