import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { StockSearchService } from '../../core/services/stock-search.service';
import { TabsComponent } from '../tabs/tabs.component';
import { SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-stock-details',
  templateUrl: './stock-details.component.html',
  styleUrls: ['./stock-details.component.css'],
  standalone: true,
  imports: [CommonModule, TabsComponent],
})
export class StockDetailsComponent {
  @Input() stockInfo: any;
  @Input() stockSymbol: string = '';

  private isMarketOpen = new BehaviorSubject<boolean>(false);
  private stockInfoSubject = new BehaviorSubject<any>(null);
  private time: any;

  public showTabs: boolean = false;
  private subscription: Subscription = new Subscription();
  constructor(private stockSearchService: StockSearchService) {}

  ngOnInit() {
    this.subscription = this.stockSearchService.exposedSearchResult.subscribe({
      next: (results) => {
        if (results && results.length > 0) {
          this.time = new Date(results.stockPriceDetails.t * 1000);
          let timeToBeConsidered =
            (new Date().getTime() - this.time.getTime()) / 1000;
          timeToBeConsidered = Math.floor(timeToBeConsidered / 60);
          if (timeToBeConsidered < 5) {
            this.isMarketOpen.next(true);
          } else {
            this.isMarketOpen.next(false);
          }
          console.log('Is market open:', this.isMarketOpen.value);
          this.stockInfo = results;
          this.showTabs = true;
          this.stockInfoSubject.next(this.stockInfo);
          console.log('Stock stockInfoSubject:', this.stockInfoSubject);
          console.log('show tabs', this.showTabs);

          console.log('stock symbol:', this.stockSymbol);
          this.stockSearchService.startPeriodicUpdate(this.stockSymbol); // Adjust the property path as per your data structure
        }
      },
      error: (error) =>
        console.error('Error while fetching stock details:', error),
    });
  }

  get stockInfo$() {
    return this.stockInfoSubject.asObservable();
  }

  get isMarketOpen$() {
    return this.isMarketOpen.asObservable();
  }

  ngOnChanges(changes: SimpleChanges) {
    this.stockInfoSubject.next(this.stockInfo);
    if (this.stockInfo.hasOwnProperty('companyInfo')) {
      this.showTabs = true;
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
}
