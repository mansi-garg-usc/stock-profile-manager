import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Observable, Subscription, of } from 'rxjs';
import * as Highcharts from 'highcharts';

@Component({
  selector: 'app-summary',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './summary.component.html',
  styleUrl: './summary.component.css',
})
export class SummaryComponent {
  @Input() stockInfo$: Observable<any> = of(null);
  @Input() isMarketOpen$: Observable<boolean> = of(false);
  stockInfo: any;
  chartData: any;
  private subscription: Subscription = new Subscription();

  // showSummaryChart() {
  //   if (this.isMarketOpen$) {


  ngOnInit() {
    this.subscription.add(
      this.stockInfo$.subscribe((data) => {
        console.log('Stock Info in summary component:', data);
        this.stockInfo = data;
      })
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
