import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  MatAutocompleteModule,
  MatAutocompleteSelectedEvent,
} from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { Observable, Subscription, of, startWith, switchMap } from 'rxjs';
import { StockSearchService } from '../../core/services/stock-search.service';
import { StockDetailsComponent } from '../stock-details/stock-details.component';

@Component({
  selector: 'app-stock-search',
  standalone: true,
  imports: [
    StockDetailsComponent,
    CommonModule,
    MatAutocompleteModule,
    MatInputModule,
    MatButtonModule,
    ReactiveFormsModule,
    MatCardModule,
  ],
  templateUrl: './stock-search.component.html',
  styleUrls: ['./stock-search.component.css'],
})
export class StockSearchComponent implements OnInit, OnDestroy {
  @Input() stockInfo: any;
  companyPeers: any;
  selectedStockSymbol: string = '';
  stockFormControl = new FormControl();
  filteredOptions: Observable<string[]> = of([]);
  private subscription: Subscription = new Subscription();

  constructor(private stockSearchService: StockSearchService) {}

  ngOnInit() {
    this.filteredOptions = this.stockFormControl.valueChanges.pipe(
      startWith(''),
      // debounceTime(300),
      switchMap((value) => this.stockSearchService.searchAutocomplete(value))
    );

    this.subscription.add(
      this.stockSearchService.exposedSearchResult.subscribe({
        next: (results) => {
          this.stockInfo =
            results?.hasOwnProperty('companyInfo') > 0
              ? {
                  companyInfo: results.companyInfo,
                  stockPriceDetails: results.stockPriceDetails,
                  companyPeers: results.companyPeers,
                }
              : null;
          console.log('Stock Info in search component:', this.stockInfo);
        },
        error: (error) => console.error('Error fetching stock data:', error),
      })
    );
  }

  searchStock(event?: any) {
    let stock = '';
    if (event && event.option && event.option.value) {
      stock = event.option.value;
    } else if (typeof event === 'string') {
      stock = event;
    } else {
      stock = this.stockFormControl.value;
    }
    if (!stock) return;
    this.selectedStockSymbol = stock;
    this.stockFormControl.setValue(stock, { emitEvent: false });

    this.stockSearchService.searchStock(stock).subscribe({
      next: (results) => {
        this.stockInfo = {
          companyInfo:
            results &&
            results?.hasOwnProperty('companyInfo') &&
            results.companyInfo,
          stockPriceDetails:
            results &&
            results?.hasOwnProperty('companyInfo') &&
            results.stockPriceDetails,
          companyPeers:
            results &&
            results?.hasOwnProperty('companyInfo') &&
            results.companyPeers,
        };
      },
      error: (error: any) => {
        console.error('Error fetching stock data:', error);
      },
    });
  }

  // ngOnChanges() {
  //   this.stockFormControl.setValue(this.selectedStockSymbol);
  // }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  clearSearchResults() {
    this.stockFormControl.setValue('');
    this.stockSearchService.clearSearchResults();
  }
}
