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

  constructor(private http: HttpClient) {
    this.fetchWatchlist().subscribe();
  }

  private baseUrl = '/api';

  fetchWatchlist(): Observable<any[]> {
    console.log('inside fetchWatchlist in service');
    return this.http.get<any[]>(`${this.baseUrl}/getwatchlist`).pipe(
      tap((entries) => {
        this.watchlistEntries.next(entries);
        console.log('watchlistEntries in service:', this.watchlistEntries);
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
    console.log('inside getWatchlistData in service');

    return this.watchlistEntries.pipe(
      switchMap((watchlistValue: any) => {
        // Assuming watchlistValue is an array of stock symbols
        if (!watchlistValue || watchlistValue.length === 0) {
          // Handle the case where the watchlist is empty
          return of([]); // Return an empty observable array
        }

        const apiCalls = watchlistValue.map((watchlistEntry: any) => {
          const stock = watchlistEntry.symbol; // Modify this if the structure is different
          return forkJoin({
            companyInfo: this.http.get(
              `${this.baseUrl}/company?symbol=${encodeURIComponent(stock)}`
            ),
            stockPriceDetails: this.http.get(
              `${this.baseUrl}/latestPrice?symbol=${encodeURIComponent(stock)}`
            ),
          }).pipe(
            map((result: any) => ({
              symbol: result.companyInfo.ticker, // Adjust according to your actual API response structure
              companyName: result.companyInfo.name, // Adjust according to your actual API response structure
              stockPrice: result.stockPriceDetails.c, // Adjust according to your actual API response structure
              changePercentage: result.stockPriceDetails.dp, // Adjust according to your actual API response structure
              changeAmount: result.stockPriceDetails.d, // Adjust according to your actual API response structure
            }))
          );
        });

        // Use forkJoin to handle all API calls at once
        return forkJoin(apiCalls);
      }),
      tap((entries) => {
        // Update BehaviorSubject with the transformed results
        this.watchlistDisplayData.next(entries);
        console.log(
          'watchlistDisplayData in service:',
          this.watchlistDisplayData
        );
      }),
      catchError((error) => {
        console.error('Error fetching watchlist data:', error);
        return throwError(() => new Error('Error fetching watchlist data'));
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

  removeFromWatchlist(symbol: string): Observable<any> {
    // Make a backend call to remove the symbol from the watchlist
    return this.http.get<any[]>(`${this.baseUrl}/removewatchlist`, { params: { symbol: symbol } }).pipe(
      tap(() => {
        // Update the watchlistEntries BehaviorSubject after successful removal
        const updatedWatchlist = this.watchlistEntries.getValue().filter((item: any) => item.symbol !== symbol);
        this.watchlistEntries.next(updatedWatchlist);
      }),
      switchMap(() => this.getWatchlistData()), // Fetch the updated watchlist data
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
