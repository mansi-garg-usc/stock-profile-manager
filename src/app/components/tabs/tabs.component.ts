import { Component, Input } from '@angular/core';
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { MatTabsModule } from '@angular/material/tabs';
import { SummaryComponent } from '../summary/summary.component';
import { TopNewsComponent } from '../top-news/top-news.component';
import { InsightsComponent } from '../insights/insights.component';
import { ChartsComponent } from '../charts/charts.component';
import { Observable, Subscription, of } from 'rxjs';

@Component({
  selector: 'app-tabs',
  standalone: true,
  imports: [
    NgbNavModule,
    MatTabsModule,
    SummaryComponent,
    TopNewsComponent,
    InsightsComponent,
    ChartsComponent,
  ],
  templateUrl: './tabs.component.html',
  styleUrls: ['./tabs.component.css'],
})
export class TabsComponent {
  @Input() stockInfo$: Observable<any> = of(null);
  private subscription: Subscription = new Subscription();

  ngOnInit() {
    this.subscription.add(
      this.stockInfo$.subscribe((stockInfo$) => {
        console.log('Stock Info in tabs component:', stockInfo$);
      })
    );
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
