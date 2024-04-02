import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Observable, Subscription, of } from 'rxjs';
import { StockSearchService } from '../../core/services/stock-search.service';
import { CommonModule } from '@angular/common';
import * as Highcharts from 'highcharts';

@Component({
  selector: 'app-insights',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './insights.component.html',
  styleUrl: './insights.component.css',
})
export class InsightsComponent implements OnInit, OnDestroy {
  @Input() stockInfo$: Observable<any> = of(null);
  @Input() isMarketOpen$: Observable<boolean> = of(false);
  @Input() stockSymbol: string = '';

  earnings: Earnings[] = [];
  trends: Trends[] = [];
  sentiments: Sentiments[] = [];
  sentimentsAggregate: SentimentsAggregate = {
    mt: 0,
    mp: 0,
    mn: 0,
    ct: 1,
    cp: 0,
    cn: 0,
  };
  splineData: SplineData = { xlabels: [], yestimate: [], yactual: [] };
  barData: BarData = { s: [], ss: [], b: [], h: [], sb: [], labels: [] };

  private earningSubscription: Subscription = new Subscription();
  private trendsSubscription: Subscription = new Subscription();
  private sentimentSubscription: Subscription = new Subscription();

  constructor(private stockSearchService: StockSearchService) {
    this.earningSubscription =
      this.stockSearchService.exposedCompanyEarnings.subscribe({
        next: (results) => {
          this.earnings = results?.length > 0 ? results : null;
        },
        error: (error) => console.error('Error fetching earnings:', error),
      });
    this.trendsSubscription =
      this.stockSearchService.exposedCompanyTrends.subscribe({
        next: (results) => {
          this.trends = results?.length > 0 ? results : null;
        },
        error: (error) => console.error('Error fetching trends:', error),
      });
    this.sentimentSubscription =
      this.stockSearchService.exposedCompanySentiment.subscribe({
        next: (results) => {
          this.sentiments = results?.length > 0 ? results : null;
        },
        error: (error) => console.error('Error fetching sentiments:', error),
      });
  }

  ngOnInit() {
    this.getInsights();
  }

  getInsights() {
    // console.log('Earnings');
    this.earningSubscription.add(
      this.stockSearchService.fetchEearnings().subscribe({
        next: (results) => {
          this.earnings = results;
          this.setSplineData(this.earnings);
          // console.log('Earnings' + this.earnings);
        },
        error: (error) => {
          console.error('Error fetching earnings:', error);
          this.earnings = [];
        },
      })
    );

    this.trendsSubscription.add(
      this.stockSearchService.fetchTrends().subscribe({
        next: (results) => {
          this.trends = results;
          this.setBarData(this.trends);
          // console.log(this.trends);
        },
        error: (error) => {
          console.error('Error fetching trends:', error);
          this.trends = [];
        },
      })
    );

    this.sentimentSubscription.add(
      this.stockSearchService.fetchSentiment().subscribe({
        next: (results) => {
          this.sentiments = results?.data;
          this.setAggregates(this.sentiments);
          // console.log('Fetched sentiments:', this.sentiments);
        },
        error: (error) => {
          console.error('Error fetching sentiments:', error);
          this.sentiments = [];
        },
      })
    );
  }

  ngOnDestroy() {
    if (this.earningSubscription) {
      this.earningSubscription.unsubscribe();
    }
    if (this.trendsSubscription) {
      this.trendsSubscription.unsubscribe();
    }
    if (this.sentimentSubscription) {
      this.sentimentSubscription.unsubscribe();
    }
  }

  public ngAfterViewInit(): void {
    this.createSplineChart();
    this.createTrends();
  }

  private setAggregates(response: Sentiments[]): void {
    this.sentimentsAggregate = { mt: 0, mp: 0, mn: 0, ct: 0, cp: 0, cn: 0 };
    for (let item of response) {
      this.sentimentsAggregate.ct = this.sentimentsAggregate.ct + item.change;
      this.sentimentsAggregate.mt += item.mspr;
      this.sentimentsAggregate.mt = parseFloat(
        Number(this.sentimentsAggregate.mt).toFixed(2)
      );

      if (item.change > 0) {
        this.sentimentsAggregate.cp += item.change;
        this.sentimentsAggregate.cp = parseFloat(
          Number(this.sentimentsAggregate.cp).toFixed(2)
        );
      } else {
        this.sentimentsAggregate.cn += item.change;
        this.sentimentsAggregate.cn = parseFloat(
          Number(this.sentimentsAggregate.cn).toFixed(2)
        );
      }

      if (item.mspr > 0) {
        this.sentimentsAggregate.mp += item.mspr;
        this.sentimentsAggregate.mp = parseFloat(
          Number(this.sentimentsAggregate.mp).toFixed(2)
        );
      } else {
        this.sentimentsAggregate.mn += item.mspr;
        this.sentimentsAggregate.mn = parseFloat(
          Number(this.sentimentsAggregate.mn).toFixed(2)
        );
      }
    }
  }

  private setSplineData(earnings: Earnings[]): void {
    this.splineData = { xlabels: [], yestimate: [], yactual: [] };
    earnings.sort((a, b) =>
      a.period > b.period ? -1 : b.period > a.period ? 11 : 0
    );

    for (let item of earnings) {
      this.splineData.xlabels.push(
        item.period + '<br/>' + ' Surprise: ' + item.surprise
      );
      this.splineData.yactual.push(item.actual);
      this.splineData.yestimate.push(item.estimate);

      // console.log('SetSplineData:', this.splineData);
    }
    this.createSplineChart();
  }

  private setBarData(trends: Trends[]): void {
    this.barData = { s: [], ss: [], b: [], h: [], sb: [], labels: [] };
    trends.sort((a, b) =>
      a.period > b.period ? -1 : b.period > a.period ? 11 : 0
    );

    for (let item of trends) {
      this.barData.b.push(item.buy);
      this.barData.h.push(item.hold);
      this.barData.s.push(item.sell);
      this.barData.ss.push(item.strongSell);
      this.barData.sb.push(item.strongBuy);
      this.barData.labels.push(item.period);

      // console.log('SetSplineData:', this.splineData);
    }
    this.createTrends();
  }

  private createSplineChart(): void {
    Highcharts.chart('container', {
      chart: {
        type: 'spline',
        backgroundColor: '#f0f0f0',
      },
      title: {
        text: 'Historical EPS Surprises',
        align: 'center',
      },
      xAxis: {
        categories: this.splineData.xlabels,
        maxPadding: 0.05,
        accessibility: {
          rangeDescription: 'Range: last 4 months',
        },
      },
      yAxis: {
        accessibility: {
          rangeDescription: 'Range: 0 to 1',
        },
        title: {
          text: 'Quarterly EPS',
        },
        labels: {
          format: '{value}',
        },
      },
      plotOptions: {
        line: {
          dataLabels: {
            enabled: true,
          },
          // enableMouseTracking: false,
        },
      },
      tooltip: {
        headerFormat: '<b>{series.name}</b><br/>',
        pointFormat: 'Earnings: {point.y}',
      },
      series: [
        {
          type: 'spline',
          name: 'Actual',
          // color: '#1AA7EC',
          data: this.splineData.yactual,
        },
        {
          type: 'spline',
          name: 'Estimate',
          // color: '#4B0082',
          data: this.splineData.yestimate,
        },
      ],
    } as any);
  }

  private createTrends(): void {
    Highcharts.chart('container1', {
      chart: {
        type: 'column',
        backgroundColor: '#f0f0f0',
      },
      title: {
        text: 'Recommendation Trends',
        align: 'center',
      },
      xAxis: {
        categories: this.barData.labels,
      },
      yAxis: {
        min: 0,
        title: {
          text: '#Analysis',
        },
        stackLabels: {
          enabled: true,
        },
      },
      plotOptions: {
        column: {
          stacking: 'normal',
          dataLabels: {
            enabled: true,
          },
        },
      },
      tooltip: {
        headerFormat: '<b>{point.x}</b><br/>',
        pointFormat: '{series.name}: {point.y}<br/>Total: {point.stackTotal}',
      },
      series: [
        {
          name: 'Strong Buy',
          data: this.barData.sb,
          color: 'green',
          type: 'column',
        },
        {
          name: 'Buy',
          data: this.barData.b,
          type: 'column',
          color: '#4aba67',
        },
        {
          name: 'Hold',
          data: this.barData.h,
          type: 'column',
          color: '#c7a748',
        },
        {
          name: 'Sell',
          data: this.barData.s,
          type: 'column',
          color: '#a56c1b',
        },
        {
          name: 'Strong Sell',
          data: this.barData.ss,
          type: 'column',
          color: '#a5321b',
        },
      ],
    } as any);
  }
}

interface Earnings {
  actual: number;
  estimate: number;
  period: string;
  surprise: number;
  surprisePercentage: number;
  symbol: string;
}

interface Trends {
  buy: number;
  hold: number;
  period: string;
  sell: number;
  strongBuy: number;
  strongSell: number;
  symbol: string;
}

interface Sentiments {
  symbol: string;
  year: number;
  month: number;
  change: number;
  mspr: number;
}

interface SentimentsAggregate {
  mt: number;
  mp: number;
  mn: number;
  ct: number;
  cp: number;
  cn: number;
}

interface SplineData {
  xlabels: string[];
  yactual: number[];
  yestimate: number[];
}

interface BarData {
  sb: number[];
  b: number[];
  h: number[];
  s: number[];
  ss: number[];
  labels: string[];
}
