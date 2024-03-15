import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class StockSearchService {
  constructor(private http: HttpClient) {}

  searchStock(stock: string) {
    return this.http.get(
      `http://localhost:8000/api/company?symbol=${encodeURIComponent(stock)}`
    );
  }

  clearStock() {
    return {};
  }
}
