import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { HighchartsChartModule } from 'highcharts-angular';
import * as Highcharts from 'highcharts/highstock';
import IndicatorsCore from 'highcharts/indicators/indicators';
import HC_gantt from 'highcharts/modules/gantt';
import HC_map from 'highcharts/modules/map';
import HC_stock from 'highcharts/modules/stock';
import { Observable, Subscription, of } from 'rxjs';
import { StockSearchService } from '../../core/services/stock-search.service';
IndicatorsCore(Highcharts);
HC_gantt(Highcharts);
HC_map(Highcharts);
HC_stock(Highcharts);

@Component({
  selector: 'app-summary',
  standalone: true,
  imports: [CommonModule, HighchartsChartModule],
  templateUrl: './summary.component.html',
  styleUrl: './summary.component.css',
})
export class SummaryComponent {
  @Input() stockInfo$: Observable<any> = of(null);
  @Input() isMarketOpen$: Observable<boolean> = of(false);
  @Input() stockSymbol: string = '';
  @Input() searchStock: any;
  @Input() direction: any;
  stockInfo: any;
  chartData: any;
  peers: any;
  chartOptions!: Highcharts.Options;
  private subscription: Subscription = new Subscription();

  // showSummaryChart() {
  //   if (this.isMarketOpen$) {
  Highcharts: typeof Highcharts = Highcharts;

  updateFlag = false;
  constructor(
    private stockSearchService: StockSearchService,
    private router: Router
  ) {}

  ngOnInit() {
    console.log('Stock Info in summary component:', this.stockInfo);
    this.subscription.add(
      this.stockInfo$.subscribe((data) => {
        this.stockInfo = data;
      })
    );
    this.peers = this.cleanupPeersArray(this.stockInfo?.companyPeers);
    this.checkChangePercentage(this.stockInfo?.stockPriceDetails?.dp);
    this.showSummaryChart();
  }

  checkChangePercentage(value: number) {
    if (value > 0) {
      this.direction = true;
    } else {
      this.direction = false;
    }
  }

  cleanupPeersArray(peers: string[]): string[] {
    const cleanedUpPeers: string[] = [];
    const encounteredPeer: Record<string, boolean> = {};

    peers?.forEach((str) => {
      if (!str.includes('.') && !encounteredPeer[str]) {
        cleanedUpPeers?.push(str);
        encounteredPeer[str] = true;
      }
    });

    // console.log('Cleaned up peers:', cleanedUpPeers);

    return cleanedUpPeers;
  }

  searchPeer(peer: string): void {
    // Navigate to the route with the ticker as a parameter
    this.searchStock(peer);
  }

  showSummaryChart() {
    var data = [];
    console.log(this.stockInfo.summaryChart.resultsCount);
    for (let i = 0; i < this.stockInfo.summaryChart.resultsCount; i++) {
      data.push([
        this.stockInfo.summaryChart.results[i].t,
        this.stockInfo.summaryChart.results[i].c,
      ]);
    }
    console.log(data);

    this.chartOptions = {
      chart: {
        backgroundColor: '#f0f0f0', // Sets the background color to light grey
      },
      title: {
        text: `${this.stockSymbol} Hourly Price Variation`,
        align: 'center',
      },
      yAxis: {
        title: {
          text: '',
        },
        opposite: true,
      },
      xAxis: {
        type: 'datetime',
      },
      plotOptions: {
        series: {
          label: {
            connectorAllowed: false,
          },
          marker: {
            enabled: false, // This disables the markers (the blue dots)
          },
          pointStart: 2010,
        },
      },
      series: [
        {
          name: `${this.stockSymbol}`,
          type: 'line',
          data: data,
          color: this.direction ? 'green' : 'red',
          // [43934, 48656, 65165, 81827, 112143, 142383, 171533, 165174, 155157, 161454, 154610]
        },
      ],
      legend: {
        enabled: false,
      },
    };
  }

  ngOnChanges() {
    this.subscription.add(
      this.stockInfo$.subscribe((data) => {
        // console.log('Stock Info in summary component:', data);
        this.stockInfo = data;
      })
    );
    this.peers = this.cleanupPeersArray(this.stockInfo?.companyPeers);
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
