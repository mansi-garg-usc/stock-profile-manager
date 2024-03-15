import { Component, Inject } from '@angular/core';
import { StockSearchService } from '../../core/services/stock-search.service';
import { HttpClientModule } from '@angular/common/http';
import { StockDetailsComponent } from '../stock-details/stock-details.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stock-search',
  standalone: true,
  imports: [CommonModule, StockDetailsComponent],
  templateUrl: './stock-search.component.html',
  styleUrls: ['./stock-search.component.css'],
})
export class StockSearchComponent {
  stockInfo: any = null; // Property to hold fetched stock data

  constructor(private stockSearchService: StockSearchService) {}

  searchStock(stock: string) {
    this.stockSearchService.searchStock(stock).subscribe({
      next: (response: any) => {
        this.stockInfo = response; // Store fetched data
        console.log(response);
      },
      error: (error: any) => {
        console.error('Error fetching stock data:', error);
      },
    });
  }
}
