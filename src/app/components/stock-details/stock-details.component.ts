import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { StockSearchService } from '../../core/services/stock-search.service';
import { TabsComponent } from '../tabs/tabs.component';

@Component({
  selector: 'app-stock-details',
  templateUrl: './stock-details.component.html',
  styleUrls: ['./stock-details.component.css'],
  standalone: true,
  imports: [CommonModule, TabsComponent],
})
export class StockDetailsComponent {
  @Input() stockInfo: any;
  private stockInfoSubject = new BehaviorSubject<any>(null);

  public showTabs: boolean = false;
  private subscription: Subscription = new Subscription();
  constructor(private stockSearchService: StockSearchService) {}

  ngOnInit() {
    this.subscription = this.stockSearchService.exposedSearchResult.subscribe({
      next: (results) => {
        this.stockInfo = results?.length > 0 ? results : null;
        results && results.length > 0
          ? (this.showTabs = true)
          : (this.showTabs = false);
        this.stockInfoSubject.next(this.stockInfo);
        console.log('Stock stockInfoSubject:', this.stockInfoSubject);
        console.log('show tabs', this.showTabs);
      },
      error: (error) =>
        console.error('Error while fetching stock details:', error),
    });
  }

  get stockInfo$() {
    return this.stockInfoSubject.asObservable();
  }

  ngOnChanges() {
    this.stockInfoSubject.next(this.stockInfo);
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
