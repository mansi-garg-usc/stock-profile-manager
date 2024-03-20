import { Component, Input } from '@angular/core';
import { Subscription } from 'rxjs';
import { NewsService } from '../../core/services/news.service';

@Component({
  selector: 'app-top-news',
  standalone: true,
  imports: [],
  templateUrl: './top-news.component.html',
  styleUrl: './top-news.component.css',
})
export class TopNewsComponent {
  @Input() news: any;
  private subscription: Subscription;

  constructor(private newsService: NewsService) {
    this.subscription = this.newsService.latestNewsResult.subscribe({
      next: (results) => {
        this.news = results.length > 0 ? results : null;
      },
      error: (error) => console.error('Error fetching news:', error),
    });
  }

  getNews(stock: string) {
    this.newsService.fetchNews(stock).subscribe({
      next: (results) => {
        this.news = results;
      },
      error: (error: any) => {
        console.error('Error fetching news:', error);
      },
    });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
