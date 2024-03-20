import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, Observable } from 'rxjs';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class StockSearchService {
  private lastQuery: string | null = null;
  private lastQueryResult: any = null;
  constructor(private http: HttpClient) {}
  private searchResult = new BehaviorSubject<any>([]);
  latestSearchResult = this.searchResult.asObservable();

  private baseUrl = 'http://localhost:8000/api';

  searchStock(stock: string): Observable<any> {
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

  clearSearchResults() {
    return {};
  }
}
