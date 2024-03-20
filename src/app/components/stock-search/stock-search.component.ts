import { Component, Inject, Input } from '@angular/core';
import { StockSearchService } from '../../core/services/stock-search.service';
import { StockDetailsComponent } from '../stock-details/stock-details.component';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-stock-search',
  standalone: true,
  imports: [StockDetailsComponent, CommonModule],
  templateUrl: './stock-search.component.html',
  styleUrls: ['./stock-search.component.css'],
})
export class StockSearchComponent {
  @Input() stockInfo: any;
  private subscription: Subscription;

  constructor(private stockSearchService: StockSearchService) {
    this.subscription = this.stockSearchService.latestSearchResult.subscribe({
      next: (results) => {
        this.stockInfo =
          results.length > 0
            ? {
                company: results.companyInfo,
                price: results.stockPriceDetails,
              }
            : null;
      },
      error: (error) => console.error('Error fetching stock data:', error),
    });
  }
  searchStock(stock: string) {
    this.stockSearchService.searchStock(stock).subscribe({
      next: (results) => {
        this.stockInfo = {
          company: results.companyInfo,
          price: results.stockPriceDetails,
        };
        console.log(this.stockInfo);
      },
      error: (error: any) => {
        console.error('Error fetching stock data:', error);
      },
    });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  clearSearchResults() {
    this.stockSearchService.clearSearchResults();
  }
}
