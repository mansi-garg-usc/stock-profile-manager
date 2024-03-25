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
  switchMap,
} from 'rxjs';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class StockSearchService {
  private updateInterval?: number;

  private currentStockSymbol = new BehaviorSubject<string | null>(null);
  exposedCurrentStockSymbol = this.currentStockSymbol.asObservable();

  private searchResult = new BehaviorSubject<any>([]);
  exposedSearchResult = this.searchResult.asObservable();

  private newsResult = new BehaviorSubject<any>([]);
  exposedNewsResult = this.newsResult.asObservable();

  private companyPeers = new BehaviorSubject<any>([]);
  exposedCompanyPeers = this.companyPeers.asObservable();

  private companySentiment = new BehaviorSubject<any>([]);
  exposedCompanySentiment = this.companySentiment.asObservable();

  private companyEarnings = new BehaviorSubject<any>([]);
  exposedCompanyEarnings = this.companyEarnings.asObservable();

  private companyTrends = new BehaviorSubject<any>([]);
  exposedCompanyTrends = this.companyTrends.asObservable();

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
    const companyPeers = this.http.get(
      `${this.baseUrl}/peers?symbol=${encodeURIComponent(stock)}`
    );
    const result = forkJoin({ companyInfo, stockPriceDetails, companyPeers });
    // const news = this.fetchNews(stock);
    result.subscribe({
      next: (response) => {
        this.updateSearchResults({
          companyInfo: response.companyInfo,
          stockPriceDetails: response.stockPriceDetails,
          companyPeers: response.companyPeers,
        });
      },
      error: (error) => {
        console.error('Error fetching stock data:', error);
        this.updateSearchResults({
          companyInfo: null,
          stockPriceDetails: null,
          companyPeers: null,
        });
      },
    });
    return result;
  }

  updateSearchResults(results: any) {
    this.searchResult?.next(results);
  }

  fetchPeersForNewTicker(): Observable<any> {
    return this.exposedCurrentStockSymbol.pipe(
      switchMap((symbol) => {
        if (!symbol) {
          return of([]);
        } else {
          return this.http
            .get<any[]>(
              `${this.baseUrl}/peers?symbol=${encodeURIComponent(symbol)}`
            )
            .pipe(
              tap((response) => {
                this.companyPeers?.next(response);
              }),
              catchError((error) => {
                console.error('Error fetching company peers:', error);
                this.companyPeers?.next('');
                return throwError(
                  () => new Error('Error fetching company peers')
                );
              })
            );
        }
      })
    );
  }

  updateStockSymbol(newSymbol: string) {
    this.currentStockSymbol?.next(newSymbol);
    // this.clearSearchResults();
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
          this.updateSearchResults({
            companyInfo: response.companyInfo,
            stockPriceDetails: response.stockPriceDetails,
            companyPeers: response.companyPeers,
          });
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
    return this.exposedCurrentStockSymbol.pipe(
      switchMap((stock) => {
        if (!stock) {
          console.error('Stock symbol is not set');
          return throwError(() => new Error('Stock symbol is not set'));
        } else {
          return this.http
            .get<any[]>(
              `${this.baseUrl}/news?symbol=${encodeURIComponent(stock)}`
            )
            .pipe(
              map((response) => {
                const filteredNews = [];
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
                      break;
                    }
                  }
                }

                return filteredNews;
              }),
              tap((filteredNews) => {
                this.newsResult.next(filteredNews);
              }),
              catchError((error) => {
                console.error('Error fetching news:', error);
                this.newsResult.next([]);
                return throwError(() => new Error('Error fetching news'));
              })
            );
        }
      })
    );
  }

  // updateNewsResults(results: any) {
  //   this.newsResult.next(results);
  // }

  fetchSentiment(): Observable<any> {
    return this.exposedCurrentStockSymbol.pipe(
      switchMap((stock) => {
        if (!stock) {
          console.error('Stock symbol is not set');
          return throwError(() => new Error('Stock symbol is not set'));
        } else {
          return this.http
            .get<any[]>(
              `${this.baseUrl}/insiderSentiment?symbol=${encodeURIComponent(
                stock
              )}`
            )
            .pipe(
              tap((response) => {
                this.companySentiment?.next(response);
              }),
              catchError((error) => {
                console.error(
                  'Error fetching company insider sentiments:',
                  error
                );
                this.companySentiment?.next('');
                return throwError(
                  () => new Error('Error fetching company insider sentiments')
                );
              })
            );
        }
      })
    );
  }

  fetchEearnings(): Observable<any> {
    return this.exposedCurrentStockSymbol.pipe(
      switchMap((stock) => {
        if (!stock) {
          console.error('Stock symbol is not set');
          return throwError(() => new Error('Stock symbol is not set'));
        } else {
          return this.http
            .get<any[]>(
              `${this.baseUrl}/earnings?symbol=${encodeURIComponent(stock)}`
            )
            .pipe(
              tap((response) => {
                this.companyEarnings?.next(response);
              }),
              catchError((error) => {
                console.error('Error fetching company earnings:', error);
                this.companyEarnings?.next('');
                return throwError(
                  () => new Error('Error fetching company earnings')
                );
              })
            );
        }
      })
    );
  }

  fetchTrends(): Observable<any> {
    return this.exposedCurrentStockSymbol.pipe(
      switchMap((stock) => {
        if (!stock) {
          console.error('Stock symbol is not set');
          return throwError(() => new Error('Stock symbol is not set'));
        } else {
          return this.http
            .get<any[]>(
              `${this.baseUrl}/recommendationTrends?symbol=${encodeURIComponent(
                stock
              )}`
            )
            .pipe(
              tap((response) => {
                this.companyTrends?.next(response);
              }),
              catchError((error) => {
                console.error('Error fetching company trends:', error);
                this.companyTrends?.next('');
                return throwError(
                  () => new Error('Error fetching company trends')
                );
              })
            );
        }
      })
    );
  }

  clearSearchResults() {
    this.searchResult?.next(null);
    this.newsResult?.next(null);
    this.companyPeers?.next(null);
  }
}
