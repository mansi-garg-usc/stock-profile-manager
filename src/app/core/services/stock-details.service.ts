import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class StockService {
  constructor(private http: HttpClient) {}

  getStockProfile(ticker: string): Observable<any> {
    return this.http.get('/api/company', {
      params: { symbol: 'AAPL' },
    });
  }
}
