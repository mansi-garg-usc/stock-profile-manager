import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  forkJoin,
  map,
  Observable,
  of,
  switchMap,
  tap,
  throwError,
} from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class WatchlistService {
  private watchlistEntries = new BehaviorSubject<any>([]);
  exposedWatchlistEntries = this.watchlistEntries.asObservable();

  private watchlistDisplayData = new BehaviorSubject<any>([]);
  exposedWatchlistDisplayData = this.watchlistDisplayData.asObservable();

  constructor(private http: HttpClient) {}

  private baseUrl = 'http://localhost:8000/api';

  fetchWatchlist(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/getwatchlist`).pipe(
      tap((entries) => {
        this.watchlistEntries.next(entries);
      }),
      catchError((error) => {
        console.error('Error fetching watchlist:', error);
        return throwError(() => new Error('Error fetching watchlist'));
      })
    );
  }

  addToWatchlist(symbol: string): Observable<any[]> {
    // Since the endpoint uses a GET request, append the symbol as a query parameter
    return this.http
      .get<any[]>(`${this.baseUrl}/addwatchlist`, {
        params: { symbol: symbol },
      })
      .pipe(
        tap((watchlistData) => {
          // Update the BehaviorSubject with the latest watchlist data
          this.watchlistEntries.next(watchlistData);
        }),
        catchError((error) => {
          console.error('Error adding to watchlist:', error);
          return throwError(() => new Error('Error adding to watchlist'));
        })
      );
  }

  // getWatchlistData(): Observable<WatchlistEntry[]> {
  //   return this.watchlistEntries.pipe(
  //     switchMap((symbols) => {
  //       if (!symbols.length) {
  //         return of([]);
  //       }
  //       const requests = symbols.map((symbol: any) => {
  //         const companyInfo$ = this.http.get<CompanyInfoResponse>(
  //           `${this.baseUrl}/company`,
  //           { params: { symbol } }
  //         );
  //         const stockPriceDetails$ = this.http.get<StockPriceDetailsResponse>(
  //           `${this.baseUrl}/latestPrice`,
  //           { params: { symbol } }
  //         );

  //         return forkJoin({
  //           companyInfo: companyInfo$,
  //           stockPriceDetails: stockPriceDetails$,
  //         });
  //       });
  //       return forkJoin(requests).pipe(
  //         map((resultsArray: any) =>
  //           resultsArray.map(
  //             (result: any) =>
  //               ({
  //                 symbol: result.companyInfo.ticker,
  //                 companyName: result.companyInfo.name,
  //                 stockPrice: result.stockPriceDetails.c,
  //                 changePercentage: result.stockPriceDetails.dp,
  //                 changeAmount: result.stockPriceDetails.d,
  //               } as WatchlistEntry)
  //           )
  //         )
  //       );
  //     })
  //   );
  // }

  getWatchlistData(): Observable<any> {
    // Make an HTTP GET request to the backend API to fetch the watchlist
    return this.watchlistEntries.pipe(
      map((watchlistValue: any) => {
        // Assuming watchlistValue is an array of stock symbols
        const apiCalls = watchlistValue.map((watchlistEntry: any) => {
          const stock = watchlistEntry.symbol; // Modify this if the structure is different
          const companyInfo = this.http.get(
            `${this.baseUrl}/company?symbol=${encodeURIComponent(stock)}`
          );
          const stockPriceDetails = this.http.get(
            `${this.baseUrl}/latestPrice?symbol=${encodeURIComponent(stock)}`
          );
          return forkJoin({ companyInfo, stockPriceDetails });
        });

        // Use forkJoin to subscribe to all API calls at once
        return forkJoin(apiCalls);
      }),
      // Flatten the double Observable into a single level
      switchMap((apiCallsResult) => apiCallsResult),
      map((resultsArray: any) =>
        resultsArray.map((result: any) => ({
          symbol: result.companyInfo.ticker, // Modify this if the structure is different
          companyName: result.companyInfo.name, // Modify this if the structure is different
          stockPrice: result.stockPriceDetails.c, // Modify this if the structure is different
          changePercentage: result.stockPriceDetails.dp, // Modify this if the structure is different
          changeAmount: result.stockPriceDetails.d, // Modify this if the structure is different
        }))
      ),
      tap((entries) => {
        // Update BehaviorSubject with the transformed results
        this.watchlistDisplayData.next(entries);
      })
    );
  }

  // addToWatchlist(ticker: string): Observable<any> {
  //   return this.http
  //     .post(`${this.baseUrl}/addwatchlist`, { symbol: ticker })
  //     .pipe(
  //       switchMap(() => this.getWatchlist()) // After adding, fetch the latest watchlist
  //     );
  // }

  // removeFromWatchlist(ticker: string): void {
  //   this.http
  //     .post(`${this.baseUrl}/removewatchlist`, { symbol: ticker })
  //     .pipe(
  //       switchMap(() => this.getWatchlist()) // After removing, fetch the latest watchlist
  //     )
  //     .subscribe((updatedWatchlist) => {
  //       this.watchlistEntries.next(updatedWatchlist); // Update the BehaviorSubject with the new watchlist
  //     });
  // }

  removeFromWatchlist(symbol: string): Observable<any[]> {
    // Remove the symbol from the current state of watchlistEntries
    const currentWatchlist = this.watchlistEntries
      .getValue()
      .filter((item: any) => item.symbol !== symbol);

    // Update the BehaviorSubject with the new state
    this.watchlistEntries.next(currentWatchlist);

    // Make a backend call to remove the symbol from the watchlist
    return this.http
      .get<any[]>(`${this.baseUrl}/removewatchlist`, {
        params: { symbol: symbol },
      })
      .pipe(
        tap(() => {
          // After the removal, we fetch the updated watchlist data
          this.getWatchlistData().subscribe(
            (updatedEntries) => {
              this.watchlistDisplayData.next(updatedEntries);
            },
            (error) => {
              console.error(
                'Error fetching updated watchlist after removal:',
                error
              );
            }
          );
        }),
        catchError((error) => {
          console.error('Error removing from watchlist:', error);
          return throwError(() => new Error('Error removing from watchlist'));
        })
      );
  }

  updateWatchlistEntries(entry: WatchlistEntry | null) {
    const watchlist = this.watchlistEntries.value;
    if (entry) {
      watchlist.push(entry);
    } else {
      watchlist.pop();
    }
    this.watchlistEntries.next(watchlist);
  }

  //   clearSearchResults() {
  //     this.searchResult?.next(null);
  //     this.newsResult?.next(null);
  //     this.companyPeers?.next(null);
  //   }
}

interface WatchlistEntry {
  symbol: string;
  companyName: any;
  stockPrice: any;
  changePercentage: any;
  changeAmount: any;
}

interface CompanyInfoResponse {
  symbol: string;
  name: string;
  // Add other company info properties as needed
}

interface StockPriceDetailsResponse {
  c: number; // Assuming 'c' represents current price
  dp: number; // Assuming 'dp' represents change percentage
  d: number; // Assuming 'd' represents change amount
  // Add other stock price details as needed
}

interface WatchlistDataResponse {
  companyInfo: CompanyInfoResponse;
  stockPriceDetails: StockPriceDetailsResponse;
}
