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

  previousWatchlistRouteData: any = null;

  constructor(private http: HttpClient) {
    this.fetchWatchlist().subscribe();
  }

  private baseUrl = 'http://localhost:8000/api';

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

  removeFromWatchlist(symbol: string): Observable<any> {
    // Make a backend call to remove the symbol from the watchlist
    return this.http
      .get<any[]>(`${this.baseUrl}/removewatchlist`, {
        params: { symbol: symbol },
      })
      .pipe(
        tap(() => {
          // Update the watchlistEntries BehaviorSubject after successful removal
          const updatedWatchlist = this.watchlistEntries
            .getValue()
            .filter((item: any) => item.symbol !== symbol);
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

  getPreviousWatchlistRouteData(): any {
    return this.previousWatchlistRouteData;
  }

  setPreviousWatchlistRouteData(): void {
    if (
      this.watchlistEntries.value !== null &&
      this.watchlistDisplayData.value !== null
    ) {
      let previousWatchlistRouteData = {
        watchlistentries: this.watchlistEntries.value,
        watchlistDisplayData: this.watchlistDisplayData.value,
      };
      this.previousWatchlistRouteData = previousWatchlistRouteData;
    } else {
      this.previousWatchlistRouteData = null;
    }
  }

  clearWatchlistData() {
    this.watchlistEntries.next([]);
    this.watchlistDisplayData.next([]);
  }
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
}

interface StockPriceDetailsResponse {
  c: number;
  dp: number;
  d: number;
}

interface WatchlistDataResponse {
  companyInfo: CompanyInfoResponse;
  stockPriceDetails: StockPriceDetailsResponse;
}
