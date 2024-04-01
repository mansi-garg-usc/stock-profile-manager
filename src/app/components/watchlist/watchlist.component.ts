import { Component, Input, SimpleChanges } from '@angular/core';
import { WatchlistService } from '../../core/services/watchlist-service';
import { CommonModule } from '@angular/common';
import { BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';
import { StockSearchService } from '../../core/services/stock-search.service';

@Component({
  selector: 'app-watchlist',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './watchlist.component.html',
  styleUrl: './watchlist.component.css',
})
export class WatchlistComponent {
  @Input() watchlistEntries: any[] = [];
  @Input() exposedWatchlistDisplayData: any[] = [];
  watchlistInfo: any[] = [];
  // isLoading: boolean = true;
  isEmpty: boolean = false;
  isLoading: boolean = true;
  direction: boolean = true;

  showEmptyWatchlistMessage = new BehaviorSubject<boolean>(false);

  constructor(
    private watchlistService: WatchlistService,
    private router: Router,
    private stockService: StockSearchService
  ) {}

  async ngOnInit() {
    // Subscribe to the exposedWatchlistEntries observable to get the latest watchlist info
    // this.watchlistService.exposedWatchlistEntries.subscribe((infoArray) => {
    //   this.watchlistInfo = infoArray;
    //   this.showEmptyWatchlistMessage.next(this.watchlistInfo.length === 0);
    //   console.log('Watchlist Info:', this.watchlistInfo);
    // });
    this.isLoading = true;

    // Initial fetch of the watchlist
    console.log('inside watchlist init');
    console.log('watchlist entires', this.watchlistEntries);
    // console.log('isloading', this.isLoading);
    await this.fetchWatchlist();
  }

  async ngOnChanges(changes: SimpleChanges) {
    // Check if watchlistEntries input has changed

    // this.isLoading = true;
    if (changes['watchlistEntries']) {
      await this.fetchWatchlist();
    }
  }

  sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  checkChangePercentage(value: number) {
    if (value > 0) {
      this.direction = true;
    } else {
      this.direction = false;
    }
  }

  async fetchWatchlist(): Promise<void> {
    console.log('Fetching watchlist data...');
    console.log('watchlist entires', this.watchlistEntries);
    // console.log('isloading', this.isLoading);
    console.log('watchlist info', this.watchlistInfo);
    // this.isLoading = true;
    // this.watchlistInfo = [];

    console.log('watchlist info now', this.watchlistInfo);
    this.watchlistService.getWatchlistData().subscribe({
      next: (infoArray) => {
        console.log('watchlist info now', this.watchlistInfo);
        if (infoArray.length === 0) {
          console.log('watchlist length is 0');
          this.showEmptyWatchlistMessage.next(true);
        } else {
          console.log('watchlist length is not 0');
          console.log('Fetched Watchlist Data:', infoArray);
          this.watchlistInfo = infoArray;
          this.checkChangePercentage(this.watchlistInfo[0].changePercentage);
        }
        // this.showEmptyWatchlistMessage.next(this.watchlistInfo.length === 0);
      },
      error: (error) => {
        console.error('Error fetching watchlist data:', error);
      },
      complete: () => {
        console.log('Watchlist data fetch complete');
      },
    });
    await this.sleep(500); // TODO
    this.isLoading = false;
  }
  searchStock(symbol: string): void {
    this.stockService.setPreviousRouteData(null);
    this.router.navigate(['/search', symbol.toUpperCase()]);
  }
  // removeFromWatchlist(symbol: string): void {
  //   // Call the service method to remove the symbol from the watchlist
  //   this.watchlistService.removeFromWatchlist(symbol.toUpperCase()).subscribe({
  //     next: () => {
  //       // After successfully removing the symbol, fetch the updated watchlist data
  //       this.watchlistService.getWatchlistData().subscribe({
  //         next: (updatedWatchlistInfo) => {
  //           // Update the local component state with the updated watchlist data
  //           this.watchlistInfo = updatedWatchlistInfo;
  //           // Check if we need to show the empty message
  //           this.showEmptyWatchlistMessage.next(this.watchlistInfo.length === 0);
  //           console.log(`Removed ${symbol} from watchlist and fetched updated watchlist data.`);
  //         },
  //         error: (error) => {
  //           // Handle errors, such as showing a user-friendly message
  //           console.error(`Error fetching updated watchlist data after removing ${symbol}:`, error);
  //         }
  //       });
  //     },
  //     error: (error) => {
  //       // Handle errors from the remove operation, such as showing a user-friendly message
  //       console.error(`Error removing ${symbol} from watchlist:`, error);
  //     }
  //   });
  // }

  removeFromWatchlist(symbol: string): void {
    this.watchlistService.removeFromWatchlist(symbol).subscribe({
      next: (updatedWatchlist) => {
        this.watchlistInfo = updatedWatchlist;

        console.log(
          `Removed ${symbol} from watchlist. Fetching updated watchlist data...`
        );
      },
      error: (error) => {
        console.error(`Error removing ${symbol} from watchlist:`, error);
      },
    });
  }
}
