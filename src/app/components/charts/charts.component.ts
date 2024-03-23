import { Component, Input } from '@angular/core';
import * as Highcharts from 'highcharts';
import { Observable, of } from 'rxjs';
import StockChart from 'highcharts/highstock';

@Component({
  selector: 'app-charts',
  standalone: true,
  imports: [],
  templateUrl: './charts.component.html',
  styleUrl: './charts.component.css',
})
export class ChartsComponent {
  @Input() stockInfo$: Observable<any> = of(null);
  @Input() isMarketOpen$: Observable<boolean> = of(false);
  @Input() stockSymbol: string = '';

  stockPriceDetails: any;

  ngOnInit() {
    this.stockInfo$.subscribe((stockInfo) => {
      if (stockInfo && stockInfo.stockPriceDetails) {
        const ohlcData = this.getOHLC(stockInfo.stockPriceDetails);
        // const volumeData = this.getVolume(stockInfo.stockPriceDetails); // Assume you have a similar method for volume
        // this.createChart(ohlcData, volumeData);
      }
    });
  }

  getOHLC(stockPriceDetails: any[]): any[] {
    let ohlc: any = [];

    // Assuming stockPriceDetails is an array of arrays with the OHLC data
    stockPriceDetails.forEach((data) => {
      ohlc.push([
        data.date, // the date
        data.o, // open
        data.h, // high
        data.l, // low
        data.c, // close
      ]);
    });

    console.log('OHLC Data:', ohlc);

    return ohlc;
  }

  getVolume() {}

  createChart(ohlcs: any[], volumes: any[]) {
    let chart = new StockChart.Chart('container', {
      // Fix: Use StockChart.Chart instead of StockChart
      rangeSelector: {
        selected: 2,
      },
      // Rest of the code...
    });
  }
}
