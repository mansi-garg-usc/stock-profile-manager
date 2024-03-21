import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import {
  Observable,
  startWith,
  map,
  Subscription,
  debounceTime,
  switchMap,
  of,
} from 'rxjs';
import { StockSearchService } from '../../core/services/stock-search.service';
import { StockDetailsComponent } from '../stock-details/stock-details.component';
import { CommonModule } from '@angular/common';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatCardModule } from '@angular/material/card';

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
            results?.length > 0
              ? {
                  company: results.companyInfo,
                  price: results.stockPriceDetails,
                }
              : null;
        },
        error: (error) => console.error('Error fetching stock data:', error),
      })
    );
  }

  searchStock(event?: MatAutocompleteSelectedEvent) {
    const stock = event ? event.option.value : this.stockFormControl.value;
    if (!stock) return;

    this.stockSearchService.searchStock(stock).subscribe({
      next: (results) => {
        this.stockInfo = {
          company: results.companyInfo,
          price: results.stockPriceDetails,
        };
      },
      error: (error: any) => {
        console.error('Error fetching stock data:', error);
      },
    });
  }

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
