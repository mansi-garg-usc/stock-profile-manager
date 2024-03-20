import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class NewsService {
  private baseUrl = 'http://localhost:8000/api';

  private newsResult = new BehaviorSubject<any>([]);

  latestNewsResult = this.newsResult.asObservable();

  constructor(private http: HttpClient) {}
  fetchNews(stock: string): Observable<any> {
    const news = this.http.get(
      `${this.baseUrl}/news?symbol=${encodeURIComponent(stock)}`
    );
    news.subscribe({
      next: (response) => {
        console.log(`news - ${response}`);
        this.updateNewsResults(response);
      },
      error: (error) => {
        console.error('Error fetching news:', error);
      },
    });
    console.log(`news - ${news}`);
    return news;
  }
  updateNewsResults(results: any) {
    this.newsResult.next(results);
  }
}
