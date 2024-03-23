import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Observable, Subscription, of } from 'rxjs';
import * as Highcharts from 'highcharts';
import { StockSearchService } from '../../core/services/stock-search.service';
import { Router } from '@angular/router';

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
  @Input() stockSymbol: string = '';
  @Input() searchStock: any;
  stockInfo: any;
  chartData: any;
  peers: any;
  private subscription: Subscription = new Subscription();

  // showSummaryChart() {
  //   if (this.isMarketOpen$) {
  constructor(
    private stockSearchService: StockSearchService,
    private router: Router
  ) {}

  ngOnInit() {
    this.subscription.add(
      this.stockInfo$.subscribe((data) => {
        // console.log('Stock Info in summary component:', data);
        this.stockInfo = data;
      })
    );
    this.peers = this.cleanupPeersArray(this.stockInfo?.companyPeers);
    // this.stockSearchService.fetchPeersForNewTicker().subscribe({
    //   next: (peers) => {
    //     console.log('Peers:', peers);
    //     let cleanedUpPeers = this.cleanupPeersArray(peers);
    //     this.peers = cleanedUpPeers;
    //   },
    //   error: (error) => console.error('Error fetching peers:', error),
    // });
  }

  // getCompanyPeers() {
  //   this.subscription.add(
  //     this.stockSearchService.fetchPeersForNewTicker().subscribe((peers) => {
  //       console.log('Peers:', peers);
  //     })
  //   );
  // }

  cleanupPeersArray(peers: string[]): string[] {
    const cleanedUpPeers: string[] = [];
    const encounteredPeer: Record<string, boolean> = {};

    peers.forEach((str) => {
      if (!str.includes('.') && !encounteredPeer[str]) {
        cleanedUpPeers.push(str);
        encounteredPeer[str] = true;
      }
    });

    console.log('Cleaned up peers:', cleanedUpPeers);

    return cleanedUpPeers;
  }

  searchPeer(peer: string): void {
    // Navigate to the route with the ticker as a parameter
    this.searchStock(peer);
  }

  showSummaryChart() {
    // Implement the logic to show the summary chart using the chartData
    // For example, you can use the Highcharts library to render the chart
    // Make sure to import the necessary modules and declare the required variables
    // Refer to the Highcharts documentation for more details on how to create charts
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
