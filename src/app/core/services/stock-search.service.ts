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
  filter,
  timer,
  finalize,
  shareReplay,
} from 'rxjs';
import { BehaviorSubject } from 'rxjs';
import { charts } from 'highcharts';
import { NavigationEnd, Router } from '@angular/router';
import { CacheService } from './cache.service';

@Injectable({
  providedIn: 'root',
})
export class StockSearchService {
  private lastCallTime: number = Date.now();
  private callDelay: number = 15000;
  // private previousRoute: string | null = null;
  // private previousRouteData: any = null;
  today = new Date();
  todayValue: string = '';
  dateToday = new Date();
  dateTodayValue: string = '';
  sixMonthsPastDate = new Date();
  sixMonthsPastDateValue: string = '';
  pastYear = new Date();
  pastYearValue: string = '';
  dateTwoDaysAgo = new Date(
    this.dateToday.setDate(this.dateToday.getDay() - 2)
  );
  dateTwoDaysAgoValue: string = '';
  previousRouteData: any = null;

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

  private summaryChart = new BehaviorSubject<any>([]);
  exposedSummaryChart = this.summaryChart.asObservable();

  private companyInfoGlobal: any;
  private ongoingSearches = new Map<string, Observable<any>>();

  constructor(
    private http: HttpClient,
    private router: Router,
    private cacheService: CacheService
  ) {
    this.computeDates();
    // this.trackNavigationEnd();
  }

  // private trackNavigationEnd() {
  //   this.router.events
  //     .pipe(
  //       filter(
  //         (event): event is NavigationEnd => event instanceof NavigationEnd
  //       ),
  //       tap((event: NavigationEnd) => {
  //         // Now 'event' is strictly typed as NavigationEnd, and 'urlAfterRedirects' is accessible
  //         this.previousRoute = event.urlAfterRedirects || event.url;
  //       })
  //     )
  //     .subscribe();
  // }

  // setPreviousRouteData(data: any): void {
  //   this.previousRouteData = data;
  // }

  // getPreviousRouteData(): any {
  //   return this.previousRouteData;
  // }

  private baseUrl = 'http://localhost:8000/api';

  formatDate(dateToBeFormatted: Date) {
    const year = dateToBeFormatted.getFullYear();
    const month = (dateToBeFormatted.getMonth() + 1)
      .toString()
      .padStart(2, '0');
    const day = dateToBeFormatted.getDate().toString().padStart(2, '0');
    console.log(`${dateToBeFormatted} - ${year}-${month}-${day}`);
    return `${year}-${month}-${day}`;
  }

  computeDates() {
    const tempDate = new Date();

    // Subtract 2 days from the tempDate
    tempDate.setDate(tempDate.getDate() - 2);

    this.sixMonthsPastDate.setMonth(this.sixMonthsPastDate.getMonth() - 6);
    this.sixMonthsPastDate.setDate(this.sixMonthsPastDate.getDate() - 1);
    this.todayValue = this.formatDate(this.today);
    console.log('todayValue', this.todayValue);
    this.pastYear.setMonth(this.pastYear.getMonth() - 24);
    this.pastYear.setDate(this.pastYear.getDate() - 1);
    this.dateTodayValue = this.formatDate(this.dateToday);
    this.dateTwoDaysAgoValue = this.formatDate(tempDate);
    console.log('dateTwoDaysAgoValue', this.dateTwoDaysAgoValue);
    this.sixMonthsPastDateValue = this.formatDate(this.sixMonthsPastDate);
    this.pastYearValue = this.formatDate(this.pastYear);
  }

  searchAutocomplete(query: string): Observable<any> {
    if (!query.trim()) {
      return of([]);
    }
    return this.http
      .get<any[]>(`${this.baseUrl}/search`, { params: { searchString: query } })
      .pipe(
        map((response) => {
          console.log('Autocomplete Response:', response); // Log the response
          return response
            .filter((stock) => !stock.displaySymbol.includes('.'))
            .map((stock) => ({
              description: stock.description,
              displaySymbol: stock.displaySymbol,
            }));
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
    const cachedData = this.cacheService.getCache(stock);
    if (cachedData) {
      return of(cachedData);
    }
    // Check if there's an ongoing search for the given stock symbol
    console.log('search logic called for stock:', stock);
    if (this.ongoingSearches.has(stock)) {
      // If there's an ongoing search, return the observable associated with it
      return (
        this.ongoingSearches.get(stock) ??
        throwError(() => new Error('Unexpected error: Observable is undefined'))
      );
    } else {
      // If there's no ongoing search, calculate if we need to delay the request
      const currentTime = Date.now();
      const timeSinceLastCall = currentTime - this.lastCallTime;

      let searchObservable: Observable<any>;

      if (timeSinceLastCall < this.callDelay) {
        // Calculate the necessary delay
        const delayTime = this.callDelay - timeSinceLastCall;

        // Create an observable with the delay and subsequent search logic
        searchObservable = timer(delayTime).pipe(
          switchMap(() => this.searchLogic(stock))
        );
      } else {
        // If enough time has passed, perform the search immediately
        searchObservable = this.searchLogic(stock);
      }

      // Apply common logic for error handling and finalization
      searchObservable = searchObservable.pipe(
        tap(() => {
          this.lastCallTime = Date.now(); // Update last call time on success
          //this.ongoingSearches.delete(stock); // Remove from the map once the data is received
          //this.ongoingSearches.set(stock, searchObservable);
        }),
        catchError((error) => {
          console.error('Error fetching stock data:', error);
          // if (error.response && error.response.status === 429) {
          //   // Retry with exponential backoff
          //   return timer(5000).pipe(switchMap(() => this.searchLogic(stock)));
          // }
          return throwError(() => new Error('Error in searchStock', error));
        }),
        shareReplay(1),
        finalize(() => {
          this.ongoingSearches.delete(stock); // Ensure cleanup in finalize block
        })
      );

      // Store the observable in the map to indicate an ongoing search
      this.ongoingSearches.set(stock, searchObservable);

      // Return the observable for the HTTP request
      return searchObservable;
    }
  }

  searchLogic(stock: string) {
    this.cacheService.clearAllCache();
    console.log('call made to server for stock:', stock);
    this.updateStockSymbol(stock);

    const companyInfo = this.http.get(
      `${this.baseUrl}/company?symbol=${encodeURIComponent(
        stock
      ).toUpperCase()}`
    );
    const stockPriceDetails = this.http.get(
      `${this.baseUrl}/latestPrice?symbol=${encodeURIComponent(
        stock
      ).toUpperCase()}`
    );
    const companyPeers = this.http.get(
      `${this.baseUrl}/peers?symbol=${encodeURIComponent(stock).toUpperCase()}`
    );
    const summaryChart = this.http.get(
      `${this.baseUrl}/highchartsHourly?symbol=${encodeURIComponent(
        stock
      ).toUpperCase()}&fromDate=${this.dateTwoDaysAgoValue}&toDate=${
        this.todayValue
      }`
    );
    console.log(
      'summaryChart',
      `${this.baseUrl}/highchartsHourly?symbol=${encodeURIComponent(
        stock
      ).toUpperCase()}&fromDate=${this.dateTwoDaysAgoValue}&toDate=${
        this.todayValue
      }`
    );
    // const summaryChart = this.http.get(
    //   `${this.baseUrl}/highchartsHourly?symbol=${encodeURIComponent(
    //     stock
    //   ).toUpperCase()}&fromDate=2024-03-27&toDate=2024-03-29`
    // );
    console.log('today', this.todayValue);
    console.log('two days ago', this.dateTwoDaysAgoValue);
    console.log('past year', this.pastYearValue);

    const chartsTabData = this.http.get(
      `${this.baseUrl}/history?symbol=${encodeURIComponent(
        stock
      ).toUpperCase()}&fromDate=${this.pastYearValue}&toDate=${this.todayValue}`
    );
    const result = forkJoin({
      companyInfo,
      stockPriceDetails,
      companyPeers,
      chartsTabData,
      summaryChart,
    });
    // const news = this.fetchNews(stock);
    result.subscribe({
      next: (response: any) => {
        this.companyInfoGlobal = response.companyInfo;
        this.updateSearchResults(stock, {
          companyInfo: response.companyInfo,
          stockPriceDetails: response.stockPriceDetails,
          companyPeers: response.companyPeers,
          chartsTabData: response.chartsTabData,
          summaryChart: response.summaryChart,
          // chartsTabData: {},
        });
        // this.searchResult.next(result);
        // return result;
      },
      error: (error) => {
        console.error('Error fetching stock data:', error);
        this.updateSearchResults(stock, {
          companyInfo: null,
          stockPriceDetails: null,
          companyPeers: null,
          chartsTabData: null,
          summaryChart: null,
        });
        // this.searchResult.next(result);
        // return result;
      },
    });

    return result;
  }

  updateSearchResults(stock: string, results: any) {
    this.searchResult?.next(results);
    this.cacheService.setCache(stock, this.searchResult.value);
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
              `${this.baseUrl}/news?symbol=${encodeURIComponent(
                stock
              )}&fromDate=${this.sixMonthsPastDateValue}&toDate=${
                this.todayValue
              }`
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

  //todo: change dates
  fetchSummaryChart(): Observable<any> {
    return this.exposedCurrentStockSymbol.pipe(
      switchMap((stock) => {
        if (!stock) {
          console.error('Stock symbol is not set');
          return throwError(() => new Error('Stock symbol is not set'));
        } else {
          return (
            this.http
              .get<any[]>(
                `${this.baseUrl}/highchartsHourly?symbol=${encodeURIComponent(
                  stock
                )}&fromDate=${this.dateTwoDaysAgoValue}&toDate=${
                  this.todayValue
                }`
              )
              // return this.http
              //   .get<any[]>(
              //     `${this.baseUrl}/highchartsHourly?symbol=${encodeURIComponent(
              //       stock
              //     )}&fromDate=2024-03-28&toDate=2024-03-30`
              //   )
              .pipe(
                tap((response) => {
                  const currentSearchResult = this.searchResult.value;
                  const updatedSearchResult = {
                    ...currentSearchResult,
                    summaryChart: response, // Update the stockPriceDetails with the new response
                  };
                  this.searchResult.next(updatedSearchResult);
                }),
                catchError((error) => {
                  console.error('Error fetching summary chart:', error);
                  this.searchResult.next({ chartsTabData: [] });
                  return throwError(
                    () => new Error('Error fetching summary chart')
                  );
                })
              )
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

  getPreviousRouteData(): any {
    return this.previousRouteData;
  }

  setPreviousRouteData(data?: any) {
    if (data) {
      this.previousRouteData = data;
    } else {
      if (this.currentStockSymbol.value !== null) {
        let previousRouteData = {
          stocksymbol: this.currentStockSymbol.value,
          searchResult: this.searchResult.value,
        };
        this.previousRouteData = previousRouteData;
      } else {
        this.previousRouteData = null;
      }
    }
  }

  clearSearchResults() {
    this.searchResult?.next(null);
    this.newsResult?.next(null);
    this.companyPeers?.next(null);
    this.companySentiment?.next(null);
    this.companyEarnings?.next(null);
    this.companyTrends?.next(null);
    this.searchResult?.next(null);
    this.cacheService.clearAllCache();
    this.currentStockSymbol?.next(null);
  }
}
