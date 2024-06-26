import { Component, Input } from '@angular/core';
import { Observable, of } from 'rxjs';
import VBP from 'highcharts/indicators/volume-by-price';
import HC_stock from 'highcharts/modules/stock';
import StockChart from 'highcharts/highstock';
import HC_map from 'highcharts/modules/map';
import { HighchartsChartModule } from 'highcharts-angular';
import * as Highcharts from 'highcharts/highstock';
import IndicatorsCore from 'highcharts/indicators/indicators';
import HC_gantt from 'highcharts/modules/gantt';
IndicatorsCore(Highcharts);
VBP(Highcharts);
HC_gantt(Highcharts);
HC_map(Highcharts);
HC_stock(Highcharts);

@Component({
  selector: 'app-charts',
  standalone: true,
  imports: [HighchartsChartModule],
  templateUrl: './charts.component.html',
  styleUrl: './charts.component.css',
})
export class ChartsComponent {
  @Input() stockInfo$: Observable<any> = of(null);
  @Input() isMarketOpen$: Observable<boolean> = of(false);
  @Input() stockSymbol: string = '';

  stockPriceDetails: any;
  chartConstructor: string = 'chart';
  Highcharts: typeof Highcharts = Highcharts;
  chartOptions!: Highcharts.Options;
  updateFlag: boolean = false;
  oneToOneFlag: boolean = true;
  runOutsideAngular: boolean = false;
  stockInfoLocal: any;

  ngOnInit() {
    this.stockInfo$.subscribe((stockInfo) => {
      if (stockInfo && stockInfo.chartsTabData) {
        // const ohlcData = this.getOHLC(stockInfo.stockPriceDetails);
        // const volumeData = this.getVolume(stockInfo.stockPriceDetails); // Assume you have a similar method for volume
        // this.createChart(ohlcData, volumeData);
        this.stockInfoLocal = stockInfo;
      }
    });
    this.createChart(this.stockInfoLocal.chartsTabData);
  }

  getOHLC(): any[] {
    let ohlc: any = [];

    // Assuming stockPriceDetails is an array of arrays with the OHLC data
    // chartsData.forEach((data) => {
    //   ohlc.push([
    //     data.date, // the date
    //     data.o, // open
    //     data.h, // high
    //     data.l, // low
    //     data.c, // close
    //   ]);
    // });

    // console.log('OHLC Data:', ohlc);

    return ohlc;
  }

  getVolume() {}

  createChart(chartsData: any): void {
    const ohlc = [],
      volume = [];
    // set the allowed units for data grouping
    const groupingUnits: [string, number[] | null][] = [
      ['week', [1]],
      ['month', [1, 2, 3, 4, 6]],
    ];
    // console.log(this.stockInfo$)
    // console.log(chartsData.resultsCount)
    for (let i = 0; i < chartsData.resultsCount; i++) {
      ohlc.push([
        chartsData.results[i].t,
        chartsData.results[i].o,
        chartsData.results[i].h,
        chartsData.results[i].l,
        chartsData.results[i].c,
      ]);
    }
    // console.log('ohlc', ohlc);

    // var maxVol = 0;
    for (let i = 0; i < chartsData.resultsCount; i++) {
      volume.push([chartsData.results[i].t, chartsData.results[i].v]);
    }
    // console.log('volume', volume);

    this.chartOptions = {
      rangeSelector: {
        buttons: [
          {
            type: 'month',
            count: 1,
            text: '1m',
            title: 'View 1 month',
          },
          {
            type: 'month',
            count: 6,
            text: '6m',
            title: 'View 6 months',
          },
          {
            type: 'month',
            count: 3,
            text: '3m',
            title: 'View 3 months',
          },
          {
            type: 'ytd',
            text: 'YTD',
            title: 'View year to date',
          },
          {
            type: 'year',
            count: 1,
            text: '1y',
            title: 'View 1 year',
          },
          {
            type: 'all',
            text: 'All',
            title: 'View all',
          },
        ],
        selected: 0,
        enabled: true,
      },

      title: {
        text: `${this.stockSymbol} Historical`,
      },
      xAxis: {
        type: 'datetime',
      },

      subtitle: {
        text: 'With SMA and Volume by Price technical indicators',
      },
      chart: {
        backgroundColor: '#f0f0f0',
      },

      yAxis: [
        {
          startOnTick: false,
          endOnTick: false,
          opposite: true,
          labels: {
            align: 'right',
            x: -3,
          },
          title: {
            text: 'OHLC',
          },
          height: '60%',
          lineWidth: 2,
          resize: {
            enabled: true,
          },
        },
        {
          opposite: true,
          labels: {
            align: 'right',
            x: -3,
          },
          title: {
            text: 'Volume',
          },
          top: '65%',
          height: '35%',
          offset: 0,
          lineWidth: 2,
        },
      ],

      tooltip: {
        split: true,
      },

      plotOptions: {
        series: {
          dataGrouping: {
            units: groupingUnits,
          },
        },
      },

      series: [
        {
          type: 'candlestick',
          name: `${this.stockSymbol}`,
          id: `${this.stockSymbol}`,
          zIndex: 2,
          data: ohlc,
        },
        {
          type: 'column',
          name: 'Volume',
          id: 'volume',
          data: volume,
          yAxis: 1,
        },
        {
          type: 'vbp',
          linkedTo: `${this.stockSymbol}`,
          params: {
            volumeSeriesID: 'volume',
          },
          dataLabels: {
            enabled: false,
          },
          zoneLines: {
            enabled: false,
          },
        },
        {
          type: 'sma',
          linkedTo: `${this.stockSymbol}`,
          zIndex: 1,
          marker: {
            enabled: false,
          },
        },
      ],
      legend: {
        enabled: false,
      },
      navigator: {
        enabled: true, // Explicitly enable navigator
      },
    };
  }
}
