import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';

export interface PortfolioRecord {
  stocksymbol: string;
  quantity: number;
  cost: number;
}

@Injectable({
  providedIn: 'root',
})
export class PortfolioService {
  private baseUrl = 'http://localhost:8000/api';

  constructor(private http: HttpClient) {}

  addPortfolioRecord(
    symbol: string,
    quantity: number,
    price: number
  ): Observable<PortfolioRecord[]> {
    const params = new HttpParams()
      .set('symbol', symbol)
      .set('stockquantity', quantity.toString())
      .set('price', price.toString());

    console.log(`inside addPortfolioRecord: ${params}`);

    return this.http
      .get<PortfolioRecord[]>(`${this.baseUrl}/addportfoliorecord`, { params })
      .pipe(
        map((response) => (Array.isArray(response) ? response : [response]))
      );
  }

  getPortfolio(): Observable<PortfolioRecord[]> {
    console.log(`inside getPortfolio`);
    return this.http
      .get<PortfolioRecord[]>(`${this.baseUrl}/getportfolio`)
      .pipe(
        map((response) => (Array.isArray(response) ? response : [response]))
      );
  }

  removePortfolioRecord(symbol: string): Observable<PortfolioRecord[]> {
    const params = new HttpParams().set('symbol', symbol);
    console.log(`inside removePortfolioRecord: ${params}`);
    return this.http
      .get<PortfolioRecord[]>(`${this.baseUrl}/removeportfoliorecord`, {
        params,
      })
      .pipe(
        map((response) => (Array.isArray(response) ? response : [response]))
      );
  }

  updatePortfolioRecord(
    symbol: string,
    quantity: number,
    price: number
  ): Observable<PortfolioRecord[]> {
    const params = new HttpParams()
      .set('symbol', symbol)
      .set('stockquantity', quantity.toString())
      .set('price', price.toString());
    console.log(`inside updatePortfolioRecord: ${params}`);

    return this.http
      .get<PortfolioRecord[]>(`${this.baseUrl}/updateportfoliorecord`, {
        params,
      })
      .pipe(
        map((response) => (Array.isArray(response) ? response : [response]))
      );
  }
}
