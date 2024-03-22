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

  public showTabs: boolean = false;
  private subscription: Subscription = new Subscription();
  constructor(private stockSearchService: StockSearchService) {}

  ngOnInit() {
    this.subscription = this.stockSearchService.exposedSearchResult.subscribe({
      next: (results) => {
        if (results && results.length > 0) {
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

  ngOnChanges(changes: SimpleChanges) {
    this.stockInfoSubject.next(this.stockInfo);
    if (this.stockInfo.hasOwnProperty('companyInfo')) {
      this.showTabs = true;
    }
    // React to changes in stockSymbol, especially for a new stock search
    if (changes['stockSymbol'] && this.stockSymbol) {
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
