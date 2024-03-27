import { computed, Injectable } from '@angular/core';
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
  dateToday = new Date();
  dateTodayValue: string = '';
  sixMonthsPastDate = new Date();
  sixMonthsPastDateValue: string = '';
  pastYear = new Date();
  pastYearValue: string = '';

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

  constructor(private http: HttpClient) {
    this.computeDates();
  }

  ngOnInit() {
    this.computeDates();
  }

  private baseUrl = 'http://localhost:8000/api';

  formatDate(dateToBeFormatted: Date) {
    const year = dateToBeFormatted.getFullYear();
    const month = (dateToBeFormatted.getMonth() + 1)
      .toString()
      .padStart(2, '0');
    const day = dateToBeFormatted.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  computeDates() {
    this.sixMonthsPastDate.setMonth(this.sixMonthsPastDate.getMonth() - 6);
    this.sixMonthsPastDate.setDate(this.sixMonthsPastDate.getDate() - 1);
    this.pastYear.setMonth(this.pastYear.getMonth() - 24);
    this.pastYear.setDate(this.pastYear.getDate() - 1);
    this.dateTodayValue = this.formatDate(this.dateToday);
    this.sixMonthsPastDateValue = this.formatDate(this.sixMonthsPastDate);
    this.pastYearValue = this.formatDate(this.pastYear);
  }

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
    console.log('today', this.dateTodayValue);
    console.log('past year', this.pastYearValue);

    const chartsTabData = this.http.get(
      `${this.baseUrl}/history?symbol=${encodeURIComponent(stock)}&fromDate=${
        this.pastYearValue
      }&toDate=${this.dateTodayValue}`
    );
    const result = forkJoin({
      companyInfo,
      stockPriceDetails,
      companyPeers,
      chartsTabData,
    });
    // const news = this.fetchNews(stock);
    result.subscribe({
      next: (response) => {
        this.updateSearchResults({
          companyInfo: response.companyInfo,
          stockPriceDetails: response.stockPriceDetails,
          companyPeers: response.companyPeers,
          chartsTabData: response.chartsTabData,
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
      this.fetchStockPriceDetails(stockSymbol).subscribe({
        next: (response) => {
          const currentSearchResult = this.searchResult.value;
          const updatedSearchResult = {
            ...currentSearchResult,
            stockPriceDetails: response, // Update the stockPriceDetails with the new response
          };
          this.searchResult.next(updatedSearchResult);

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

  fetchStockPriceDetails(stock: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/latestPrice?symbol=${stock}`);
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
              `${this.baseUrl}/news?symbol=${encodeURIComponent(stock)}&fromDate=${this.sixMonthsPastDateValue}&toDate=${this.dateTodayValue}`
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
