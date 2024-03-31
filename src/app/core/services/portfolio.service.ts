import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, map, Observable, tap } from 'rxjs';

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
  private _walletMoneySubject = new BehaviorSubject<number>(0);

  constructor(private http: HttpClient) {
    this.fetchWalletMoney();
  }

  get walletMoney(): Observable<number> {
    return this._walletMoneySubject.asObservable();
  }

  fetchWalletMoney(): void {
    console.log('Fetching wallet money in portfolio service');
    this.http
      .get<number>(`${this.baseUrl}/getwalletmoney`)
      .pipe(
        tap((walletMoney: any) => {
          this._walletMoneySubject.next(walletMoney[0].walletmoney);
          console.log(
            `Wallet Money fetched in portfolio service: ${walletMoney}`
          );
        })
      )
      .subscribe({
        next: () => {},
        error: (error) => console.error('Error fetching wallet money:', error),
        complete: () => console.log('Completed fetching wallet money'),
      });
  }

  updateWalletMoney(amount: number): void {
    const currentAmount = this._walletMoneySubject.value;

    console.log(
      `Wallet Money before update in portfolio service: ${currentAmount}`
    );

    const updatedAmount = parseFloat(Number(currentAmount + amount).toFixed(2));
    console.log(`Updating wallet money in portfolio service: ${amount}`);
    this.http
      .get(`${this.baseUrl}/setwalletmoney?updatedAmount=${updatedAmount}`)
      .subscribe({
        next: () => this.fetchWalletMoney(),
        error: (error) => console.error('Error updating wallet money:', error),
        complete: () => console.log('Completed updating wallet money'),
      });
  }

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
