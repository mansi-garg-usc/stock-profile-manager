import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Observable, Subscription, of } from 'rxjs';
import { StockSearchService } from '../../core/services/stock-search.service';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-top-news',
  standalone: true,
  imports: [MatCardModule, CommonModule, NgbModule],
  templateUrl: './top-news.component.html',
  styleUrls: [
    // './node_modules/bootstrap/dist/css/bootstrap.min.css',
    './top-news.component.css',
  ],
})
export class TopNewsComponent implements OnInit, OnDestroy {
  news: NewsItem[] = []; // This type should represent the structure of news data
  private subscription: Subscription = new Subscription();
  @Input() stockInfo$: Observable<any> = of(null);
  @Input() isMarketOpen$: Observable<boolean> = of(false);

  constructor(private stockSearchService: StockSearchService) {
    this.subscription = this.stockSearchService.exposedNewsResult.subscribe({
      next: (results) => {
        this.news = results?.length > 0 ? results : null;
      },
      error: (error) => console.error('Error fetching news:', error),
    });
  }
  ngOnInit() {
    this.getNews();
  }

  getNews() {
    this.subscription.add(
      this.stockSearchService.fetchNews().subscribe({
        next: (results) => {
          // this.news = results
          //   .filter(
          //     (item: any) =>
          //       item.source &&
          //       item.datetime &&
          //       item.headline &&
          //       item.summary &&
          //       item.url
          //   )
          //   .map((item: any) => ({
          //     title: item.headline, // Assuming 'headline' is what you meant by 'title'
          //     image: item.image, // Ensure 'image' field exists in your data
          //     summary: item.summary,
          //     datetime: item.datetime,
          //     url: item.url,
          //     source: item.source,
          //   }));

          // console.log(this.news);

          this.news = results;
          console.log(this.news);
        },
        error: (error) => {
          console.error('Error fetching news:', error);
          this.news = [];
        },
      })
    );
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}

interface NewsItem {
  title: string;
  image: string;
  summary: string;
  datetime: string;
  url: string;
  source: string;
  headline: string;
}
