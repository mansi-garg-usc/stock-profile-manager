import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  forkJoin,
  Observable,
  tap,
  catchError,
  map,
  throwError,
  of,
} from 'rxjs';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class StockSearchService {
  private updateInterval?: number;

  private currentStockSymbol = new BehaviorSubject<string | null>(null);

  private searchResult = new BehaviorSubject<any>([]);
  exposedSearchResult = this.searchResult.asObservable();

  private newsResult = new BehaviorSubject<any>([]);
  exposedNewsResult = this.newsResult.asObservable();

  constructor(private http: HttpClient) {}

  private baseUrl = 'http://localhost:8000/api';

  searchAutocomplete(query: string): Observable<string[]> {
    if (!query.trim()) {
      return of([]);
    }
    return this.http
      .get<any[]>(`${this.baseUrl}/search`, { params: { searchString: query } })
      .pipe(
        map((response) => {
          console.log('Autocomplete Response:', response); // Log the response
          return response.map((stock) => stock.displaySymbol);
        }),
        catchError((error) => {
          console.error('Error fetching autocomplete data:', error);
          return throwError(
            () => new Error('Error fetching autocomplete data')
          );
        })
      );
  }

  searchStock(stock: string): Observable<any> {
    this.updateStockSymbol(stock);

    const companyInfo = this.http.get(
      `${this.baseUrl}/company?symbol=${encodeURIComponent(stock)}`
    );
    const stockPriceDetails = this.http.get(
      `${this.baseUrl}/latestPrice?symbol=${encodeURIComponent(stock)}`
    );
    const result = forkJoin({ companyInfo, stockPriceDetails });
    // const news = this.fetchNews(stock);
    result.subscribe({
      next: (response) => {
        this.updateSearchResults(
          { companyInfo: response.companyInfo, stockPriceDetails: response.stockPriceDetails },
        );
      },
      error: (error) => {
        console.error('Error fetching stock data:', error);
        this.updateSearchResults({ companyInfo: null, stockPriceDetails: null});
      },
    });
    return result;
  }

  updateSearchResults(results: any) {
    this.searchResult?.next(results);
  }

  updateStockSymbol(newSymbol: string) {
    this.currentStockSymbol?.next(newSymbol);
  }
  clearSearchResults() {
    this.searchResult?.next(null);
    this.newsResult?.next(null);
  }

  startPeriodicUpdate(stockSymbol: string) {
    console.log('Starting periodic update for', stockSymbol);
    // Clear existing interval to avoid multiple intervals running simultaneously
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    // Set up a new interval
    this.updateInterval = window.setInterval(() => {
      this.searchStock(stockSymbol).subscribe({
        next: (response) => {
          this.updateSearchResults(
            {
              companyInfo: response.companyInfo,
              stockPriceDetails: response.stockPriceDetails,
            },
          );
          console.log('Data updated', response);
          // Handle the response if needed
        },
        error: (error) => console.error('Error updating data:', error),
      });
    }, 15000); // 15 seconds interval
  }

  stopPeriodicUpdate() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = undefined; // Reset the interval reference
    }
  }

  fetchNews(): Observable<any> {
    const stock = this.currentStockSymbol?.value;
    if (!stock) {
      throw new Error('Stock symbol is not set');
    }
    return this.http
      .get<any[]>(`${this.baseUrl}/news?symbol=${encodeURIComponent(stock)}`)
      .pipe(
        map((response) => {
          // Initialize an array to hold the filtered news items
          const filteredNews = [];

          // Loop through the response and add items with all required fields
          // to the filteredNews array until it contains 20 items
          for (let item of response) {
            if (
              item.source &&
              item.datetime &&
              item.headline &&
              item.summary &&
              item.url &&
              item.image
            ) {
              filteredNews?.push(item);
              if (filteredNews?.length === 20) {
                break; // Exit the loop once 20 valid items are found
              }
            }
          }

          return filteredNews;
        }),
        tap((filteredNews) => {
          // Update the BehaviorSubject with the filtered news
          this.newsResult?.next(filteredNews);
        }),
        catchError((error) => {
          console.error('Error fetching news:', error);
          this.newsResult?.next([]); // Clear the news results on error
          return throwError(() => new Error('Error fetching news')); // Re-throw the error for subscribers to handle
        })
      );
  }

  updateNewsResults(results: any) {
    this.newsResult.next(results);
  }
}
