import { Component, Input, SimpleChanges } from '@angular/core';
import { WatchlistService } from '../../core/services/watchlist-service';
import { CommonModule } from '@angular/common';
import { BehaviorSubject } from 'rxjs';

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

  showEmptyWatchlistMessage = new BehaviorSubject<boolean>(false);

  constructor(private watchlistService: WatchlistService) {}

  ngOnInit() {
    // Subscribe to the exposedWatchlistEntries observable to get the latest watchlist info
    // this.watchlistService.exposedWatchlistEntries.subscribe((infoArray) => {
    //   this.watchlistInfo = infoArray;
    //   this.showEmptyWatchlistMessage.next(this.watchlistInfo.length === 0);
    //   console.log('Watchlist Info:', this.watchlistInfo);
    // });

    // Initial fetch of the watchlist
    this.fetchWatchlist();
  }
  ngOnChanges(changes: SimpleChanges) {
    // Check if watchlistEntries input has changed
    if (changes['watchlistEntries']) {
      this.fetchWatchlist();
    }
  }

  fetchWatchlist(): void {
    this.watchlistService.getWatchlistData().subscribe({
      next: (infoArray) => {
        console.log('Fetched Watchlist Data:', infoArray);
        this.watchlistInfo = infoArray;
        this.showEmptyWatchlistMessage.next(this.watchlistInfo.length === 0);
      },
      error: (error) => {
        console.error('Error fetching watchlist data:', error);
      }
    });
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
        // The service has updated the BehaviorSubject with the new watchlist data
        console.log(`Removed ${symbol} from watchlist. Fetching updated watchlist data...`);
        // Now you could manually call getWatchlistData if needed or rely on the automatic update from the service
      },
      error: (error) => {
        console.error(`Error removing ${symbol} from watchlist:`, error);
      }
    });
  }
  
}
