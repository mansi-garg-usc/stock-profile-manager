import { Component, SimpleChanges } from '@angular/core';
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
  watchlistInfo: any[] = [];

  showEmptyWatchlistMessage = new BehaviorSubject<boolean>(false);

  constructor(private watchlistService: WatchlistService) {}

  ngOnInit() {
    this.watchlistService.getWatchlist().subscribe((infoArray) => {
      this.watchlistInfo = infoArray;
      this.showEmptyWatchlistMessage.next(this.watchlistInfo.length === 0);
      console.log('Watchlist Info:', this.watchlistInfo);
    });
  }

  loadWatchlist(): string[] {
    const watchlist = localStorage.getItem('watchlist');
    return watchlist ? JSON.parse(watchlist) : [];
  }

  addToWatchlist(ticker: string): void {
    const watchlist = this.loadWatchlist();
    if (!watchlist.includes(ticker.toUpperCase())) {
      watchlist.push(ticker.toUpperCase());
      localStorage.setItem('watchlist', JSON.stringify(watchlist));
      if (watchlist.length > 0) {
        this.showEmptyWatchlistMessage.next(false);
      }
      console.log(`Added ${ticker} to watchlist`);
    }
  }

  removeFromWatchlist(ticker: string): void {
    let watchlist = this.loadWatchlist();
    if (watchlist.includes(ticker.toUpperCase())) {
      // Remove from the local array
      this.watchlistInfo = this.watchlistInfo.filter(
        (entry) => entry.symbol.toUpperCase() !== ticker.toUpperCase()
      );

      watchlist = watchlist.filter((item) => item.toUpperCase() !== ticker.toUpperCase());
      localStorage.setItem('watchlist', JSON.stringify(watchlist));
      this.showEmptyWatchlistMessage.next(this.watchlistInfo.length === 0);
      // Update the BehaviorSubject

      // Update local storage
      console.log(`Removed ${ticker} from watchlist`);
    }
  }
}
