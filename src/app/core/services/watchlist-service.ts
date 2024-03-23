import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, forkJoin, map, Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class WatchlistService {
  private watchlistEntries = new BehaviorSubject<any>([]);
  exposedWatchlistEntries = this.watchlistEntries.asObservable();

  constructor(private http: HttpClient) {}

  private baseUrl = 'http://localhost:8000/api';

  getWatchlist(): Observable<any> {
    const watchlistLocalStorageValue = localStorage.getItem('watchlist');
    const watchlistValue = watchlistLocalStorageValue
      ? JSON.parse(watchlistLocalStorageValue)
      : [];

    // Collect all API call observables here
    const apiCalls = watchlistValue.map((stock: string) => {
      const companyInfo = this.http.get(
        `${this.baseUrl}/company?symbol=${encodeURIComponent(stock)}`
      );
      const stockPriceDetails = this.http.get(
        `${this.baseUrl}/latestPrice?symbol=${encodeURIComponent(stock)}`
      );
      return forkJoin({ companyInfo, stockPriceDetails });
    });

    // Use forkJoin to subscribe to all API calls at once
    return forkJoin(apiCalls).pipe(
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
        this.watchlistEntries.next(entries);
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
