import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  MatAutocompleteModule,
  MatAutocompleteSelectedEvent,
} from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import {
  BehaviorSubject,
  Observable,
  Subscription,
  catchError,
  debounceTime,
  filter,
  finalize,
  of,
  startWith,
  switchMap,
  tap,
} from 'rxjs';
import { StockSearchService } from '../../core/services/stock-search.service';
import { StockDetailsComponent } from '../stock-details/stock-details.component';
import { ActivatedRoute, Router } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ChangeDetectorRef } from '@angular/core';

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
    MatProgressSpinnerModule,
  ],
  templateUrl: './stock-search.component.html',
  styleUrls: ['./stock-search.component.css'],
})
export class StockSearchComponent implements OnInit, OnDestroy {
  @Input() stockInfo: any;

  // route: ActivatedRoute = inject(ActivatedRoute);
  companyPeers: any;
  selectedStockSymbol: string = '';
  stockFormControl = new FormControl();
  filteredOptions: Observable<string[] | null> = of([]);
  private subscription: Subscription = new Subscription();
  watchlist = localStorage.setItem('watchlist', JSON.stringify([]));
  searchResultsDisplayed: boolean = false;
  isAutocompleteLoading = new BehaviorSubject<boolean>(false);
  tickerUrlParam: any = '';
  invalidEntry: boolean = false;

  constructor(
    private stockSearchService: StockSearchService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute = inject(ActivatedRoute)
  ) {}

  ngOnInit() {
    this.route.params.subscribe((params) => {
      const symbol = params['ticker']; // Ensure 'symbol' matches the name of the parameter defined in your route configuration
      if (symbol && symbol !== 'home') {
        this.selectedStockSymbol = symbol;
        this.stockFormControl.setValue(symbol);
        this.searchStock(symbol);
      }
    });
    const previousData = this.stockSearchService.getPreviousRouteData();
    // if (previousData) {
    //   // Restore the state only if there's previous data
    //   this.stockInfo = previousData.stockInfo;
    //   console.log('Stock Info restored from previous data:', this.stockInfo);
    //   this.stockFormControl.setValue(previousData.stockFormControlValue);
    // } else {
    // Initialize your state only if there's no previous data
    this.filteredOptions = this.stockFormControl.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      switchMap((value) => this.fetchAutocompleteOptions(value)),
      filter((options) => Array.isArray(options) && options.length > 0)
    );

    this.subscription.add(
      this.stockSearchService.exposedSearchResult.subscribe({
        next: (results) => {
          // Update stockInfo based on new search results
          this.stockInfo = this.extractStockInfo(results);
          console.log('Stock Info updated from new search:', this.stockInfo);
        },
        error: (error) => console.error('Error fetching stock data:', error),
      })
    );
    // }
  }

  private extractStockInfo(results: any): any {
    // Method to extract and return stock info from search results
    // Adjust according to your data structure
    return results?.hasOwnProperty('companyInfo')
      ? {
          companyInfo: results.companyInfo,
          stockPriceDetails: results.stockPriceDetails,
          companyPeers: results.companyPeers,
          chartsTabData: results.chartsTabData,
        }
      : null;
  }

  fetchAutocompleteOptions(searchTerm: string): Observable<string[]> {
    if (!searchTerm.trim()) {
      return of([]);
    }

    this.isAutocompleteLoading.next(true); // Start loading

    return this.stockSearchService.searchAutocomplete(searchTerm.trim()).pipe(
      catchError(() => of([])), // Handle errors gracefully by returning an empty array
      finalize(() => this.isAutocompleteLoading.next(false)) // Ensure loading is stopped
    );
  }

  searchStock(event?: any) {
    let stock = '';
    if (event instanceof MatAutocompleteSelectedEvent) {
      stock = event.option.value;
    } else if (event && event.option && event.option.value) {
      stock = event.option.value;
    } else if (typeof event === 'string') {
      stock = event;
    } else {
      stock = this.stockFormControl.value;
    }
    if (!stock) {
      this.invalidEntry = true;
    }

    this.router.navigate(['/search', stock]);
    this.tickerUrlParam = this.route.snapshot.params['ticker'];
    console.log('tickerUrlParam', this.tickerUrlParam);
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
          chartsData:
            results &&
            results?.hasOwnProperty('companyInfo') &&
            results.chartsData,
        };
        this.searchResultsDisplayed = true;
        this.isAutocompleteLoading.next(false);
        // this.filteredOptions = of([]);
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
    this.stockSearchService.setPreviousRouteData({
      stockInfo: this.stockInfo,
      stockFormControlValue: this.stockFormControl.value,
    });
    // sessionStorage.setItem('stateSave', this.stockInfo);
  }

  clearSearchResults() {
    this.stockFormControl.setValue('');
    this.stockSearchService.clearSearchResults();
    this.searchResultsDisplayed = false;
    this.stockInfo = null;
    this.stockSearchService.setPreviousRouteData(null);
    // this.cdr.detectChanges();
    this.router.navigate(['/search/home']);
    this.invalidEntry = false;

    // this.filteredOptions = of([]); // Reset filtered options to prevent empty dropdown
    // this.filteredOptions = of([]);
    // this.stockInfo = null;
  }
}
