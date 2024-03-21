import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, Observable, tap, catchError, map, throwError } from 'rxjs';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class StockSearchService {
  private currentStockSymbol = new BehaviorSubject<string | null>(null);
  //exposedCurrentStockSymbol = this.currentStockSymbol.asObservable();

  private searchResult = new BehaviorSubject<any>([]);
  exposedSearchResult = this.searchResult.asObservable();

  private newsResult = new BehaviorSubject<any>([]);
  exposedNewsResult = this.newsResult.asObservable();

  constructor(private http: HttpClient) {}

  private baseUrl = 'http://localhost:8000/api';

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
        this.updateSearchResults([
          { company: response.companyInfo, price: response.stockPriceDetails },
        ]);
      },
      error: (error) => {
        console.error('Error fetching stock data:', error);
        this.updateSearchResults([]);
      },
    });
    return result;
  }

  updateSearchResults(results: any) {
    this.searchResult.next(results);
  }

  updateStockSymbol(newSymbol: string) {
    this.currentStockSymbol.next(newSymbol);
  }
  clearSearchResults() {
    this.searchResult.next(null);
    this.newsResult.next(null);
  }

  // fetchNews(): Observable<any> {
  //   const stock = this.currentStockSymbol.value;
  //   if (!stock) {
  //     throw new Error('Stock symbol is not set');
  //   }
  //   const news = this.http
  //     .get(`${this.baseUrl}/news?symbol=${encodeURIComponent(stock)}`)
  //     .pipe(
  //       tap((response) => {
  //         console.log(`news - ${response}`);
  //         this.updateNewsResults(response);
  //       }),
  //       catchError((error) => {
  //         console.error('Error fetching news:', error);
  //         this.newsResult.next([]);
  //         throw error; // Re-throw the error so it can be handled downstream
  //       })
  //     );

  //     console.log(`news2 - ${news}`);

  //   return news;
  // }
  fetchNews(): Observable<any> {
    const stock = this.currentStockSymbol.value;
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
              filteredNews.push(item);
              if (filteredNews.length === 20) {
                break; // Exit the loop once 20 valid items are found
              }
            }
          }

          return filteredNews;
        }),
        tap((filteredNews) => {
          // Update the BehaviorSubject with the filtered news
          this.newsResult.next(filteredNews);
        }),
        catchError((error) => {
          console.error('Error fetching news:', error);
          this.newsResult.next([]); // Clear the news results on error
          return throwError(() => new Error('Error fetching news')); // Re-throw the error for subscribers to handle
        })
      );
  }

  updateNewsResults(results: any) {
    this.newsResult.next(results);
  }
}
