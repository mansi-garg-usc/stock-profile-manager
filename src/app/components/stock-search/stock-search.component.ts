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
  distinct,
  distinctUntilChanged,
  filter,
  finalize,
  map,
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
  exposedCurrentStockSymbol: any;

  // route: ActivatedRoute = inject(ActivatedRoute);
  companyPeers: any;
  selectedStockSymbol: string = '';
  stockFormControl = new FormControl();
  filteredOptions: Observable<any> = of([]);
  private subscription: Subscription = new Subscription();
  watchlist = localStorage.setItem('watchlist', JSON.stringify([]));
  searchResultsDisplayed: boolean = false;
  isAutocompleteLoading: boolean = false;
  tickerUrlParam: any = '';
  invalidEntry: boolean = false;
  isLoaded: boolean = true;

  constructor(
    private stockSearchService: StockSearchService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute = inject(ActivatedRoute)
  ) {}

  ngOnInit() {
    // this.subscribeToAutocomplete();
    console.log('selectedStockSymbol', this.selectedStockSymbol);

    this.route.params.subscribe((params) => {
      const symbol = params['ticker'];
      if (symbol && symbol !== 'home') {
        this.isLoaded = false;
        this.stockInfo = null;
        this.selectedStockSymbol = symbol;
        this.stockFormControl.setValue(symbol);
        this.searchStock(symbol);
      }
    });

    this.filteredOptions = this.stockFormControl.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      distinctUntilChanged(),
      filter((term) => term && term.length > 1),
      switchMap((term) => {
        this.isAutocompleteLoading = true;
        if (term !== this.exposedCurrentStockSymbol) {
          return this.stockSearchService.searchAutocomplete(term).pipe(
            catchError(() => of([])), // Handle errors gracefully by returning an empty array
            map((options) => {
              this.isAutocompleteLoading = false;
              return options;
            })
          );
        } else {
          this.isAutocompleteLoading = false;
          return of([]);
        }
      })
    );

    this.subscription.add(
      this.stockSearchService.exposedCurrentStockSymbol
        .pipe(distinctUntilChanged())
        .subscribe({
          next: (symbol) => {
            this.exposedCurrentStockSymbol = symbol;
          },
        })
    );

    this.subscription.add(
      this.stockSearchService.exposedSearchResult
        .pipe(distinctUntilChanged())
        .subscribe({
          next: (results) => {
            // Update stockInfo based on new search results
            this.isLoaded = true;
            console.log(
              'exposed search result ke subscriptions se data in stock search component:',
              results
            );
            let extractedResults = this.extractStockInfo(results);
            if (
              (extractedResults && extractedResults.companyInfo !== null)
            ) {
              this.stockInfo = extractedResults;
              this.searchResultsDisplayed = true;
              // this.isAutocompleteLoading = false;
            } else {
              // this.invalidEntry = true;
              // this.isAutocompleteLoading = false;
              this.isLoaded = true;
            }
            console.log('Stock Info updated from new search:', this.stockInfo);
          },
          error: (error) => {
            console.error('Error fetching stock data:', error);
            this.invalidEntry = true;
            this.isLoaded = true;
          },
        })
    );
  }
  // }

  // getValueForAC(value: string): Observable<any> {
  //   if (!value.trim()) {
  //     return of([]);
  //   }

  //   // Start loading indicator
  //   this.isAutocompleteLoading = true;

  //   return this.stockSearchService.searchAutocomplete(value).pipe(
  //     tap((data) => console.log('Data from backend:', data)),
  //     catchError((error) => {
  //       console.error('Error during stock query:', error);
  //       this.isAutocompleteLoading = false; // Ensure loading is stopped on error
  //       return of([]);
  //     }),
  //     finalize(() => (this.isAutocompleteLoading = false)) // Ensure loading is stopped
  //   );
  // }

  private extractStockInfo(results: any): any {
    // Method to extract and return stock info from search results
    // Adjust according to your data structure
    if (this.selectedStockSymbol !== '') {
      return results?.hasOwnProperty('companyInfo')
        ? {
            companyInfo: results.companyInfo,
            stockPriceDetails: results.stockPriceDetails,
            companyPeers: results.companyPeers,
            chartsTabData: results.chartsTabData,
            summaryChart: results.summaryChart,
          }
        : null;
    }
  }

  fetchAutocompleteOptions(searchTerm: string): Observable<any> {
    if (!searchTerm.trim()) {
      return of([]);
    }

    this.isAutocompleteLoading = true; // Start loading

    return this.stockSearchService.searchAutocomplete(searchTerm).pipe(
      catchError(() => of([])), // Handle errors gracefully by returning an empty array
      finalize(() => (this.isAutocompleteLoading = false)) // Ensure loading is stopped
    );
  }

  searchStock(event?: any) {
    this.isLoaded = false;
    this.invalidEntry = false;
    let stock = '';
    // this.unsubscribeFromAutocomplete();
    // if (event instanceof MatAutocompleteSelectedEvent) {
    //   stock = event?.displaySymbol.value;
    // } else
    if (event && event.option && event.option.value) {
      if (event.option.value.displaySymbol) {
        stock = event.option.value.displaySymbol;
      } else {
        stock = event.option.value;
      }
      console.log('stock', stock);
      console.log('event', event);
    } else if (typeof event === 'string') {
      stock = event;
    } else {
      stock = this.stockFormControl.value;
    }
    if (!stock) {
      this.invalidEntry = true;
      this.isLoaded = true;
    } else {
      if (stock !== this.selectedStockSymbol) {
        this.router.navigate(['/search', stock]);
      }
      this.tickerUrlParam = this.route.snapshot.params['ticker'];
      console.log('tickerUrlParam', this.tickerUrlParam);
      this.selectedStockSymbol = stock;
      this.stockFormControl.setValue(stock, { emitEvent: false });

      this.stockSearchService
        .searchStock(stock)
        .pipe(distinctUntilChanged())
        .subscribe({
          next: (results) => {
            if (JSON.stringify(results.companyInfo) !== '{}') {
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
                summaryChart:
                  results &&
                  results?.hasOwnProperty('companyInfo') &&
                  results.summaryChart,
              };
              this.searchResultsDisplayed = true;
              this.isAutocompleteLoading = false;
              this.isLoaded = true;
              //   let extractedResults = this.extractStockInfo(results);
              // if (extractedResults && extractedResults.companyInfo !== null) {
              //   this.stockInfo = extractedResults;
              //   this.searchResultsDisplayed = true;
              //   this.isAutocompleteLoading = false;
              // }
              // this.filteredOptions = of([]);
            } else if (results.companyInfo === undefined) {
              this.invalidEntry = true;
              // this.isAutocompleteLoading = false;
              this.isLoaded = true;
              // this.searchResultsDisplayed = false;
              // this.stockInfo = null;
              // this.filteredOptions = of([]);
            }
          },
          error: (error: any) => {
            console.error('Error fetching stock data:', error);
            this.isLoaded = true;
            // this.invalidEntry = true;
          },
        });
    }
    // this.isLoaded = true;
    // this.subscribeToAutocomplete();
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
    this.filteredOptions = of([]);

    this.selectedStockSymbol = '';
    // this.filteredOptions = of([]); // Reset filtered options to prevent empty dropdown
    // this.filteredOptions = of([]);
    // this.stockInfo = null;
  }
}
