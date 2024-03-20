import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Subscription } from 'rxjs';
import { StockSearchService } from '../../core/services/stock-search.service';

@Component({
  selector: 'app-stock-details',
  templateUrl: './stock-details.component.html',
  styleUrls: ['./stock-details.component.css'],
  standalone: true,
  imports: [CommonModule],
})
export class StockDetailsComponent {
  @Input() stockInfo: any;
  private subscription: Subscription = new Subscription();
  constructor(private stockSearchService: StockSearchService) {}

  ngOnInit() {
    this.subscription = this.stockSearchService.latestSearchResult.subscribe({
      next: (results) => {
        this.stockInfo = results.length > 0 ? results : null;
      },
      error: (error) =>
        console.error('Error while fetching stock details:', error),
    });
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
