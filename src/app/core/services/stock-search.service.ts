import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class StockSearchService {
  constructor(private http: HttpClient) {}
  private baseUrl = 'http://localhost:8000/api';

  searchStock(stock: string): Observable<any> {
    const companyInfo = this.http.get(
      `${this.baseUrl}/company?symbol=${encodeURIComponent(stock)}`
    );
    const stockPriceDetails = this.http.get(
      `${this.baseUrl}/latestPrice?symbol=${encodeURIComponent(stock)}`
    );
    return forkJoin({ companyInfo, stockPriceDetails });
  }

  clearStock() {
    return {};
  }
}
