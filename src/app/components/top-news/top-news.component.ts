import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Observable, Subscription, of } from 'rxjs';
import { StockSearchService } from '../../core/services/stock-search.service';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';
import { NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NewsModalComponent } from '../utility-components/news-modal/news-modal.component';

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
  @Input() stockSymbol: string = '';

    constructor(private stockSearchService: StockSearchService, private modalService: NgbModal) {
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

  getNewsByUrl(url: string) {
    console.log(this.news)
    return this.news.filter(individualNews => {
      return individualNews.url === url
    })
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  openNewsModal(url: string) {
    const newsModalReference = this.modalService.open(NewsModalComponent);
    const currentNews = this.getNewsByUrl(url)[0]
    newsModalReference.componentInstance.source = currentNews.source;
    newsModalReference.componentInstance.datetime = this.convertUnixToDate(currentNews.datetime);
    newsModalReference.componentInstance.headline = currentNews.headline;
    newsModalReference.componentInstance.summary = currentNews.summary;
    newsModalReference.componentInstance.url = currentNews.url;
  }

  convertUnixToDate(unixTimestamp: number) {
    var date = new Date(unixTimestamp * 1000);
    var options: any = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  }
}

interface NewsItem {
  title: string;
  image: string;
  summary: string;
  datetime: number;
  url: string;
  source: string;
  headline: string;
}
