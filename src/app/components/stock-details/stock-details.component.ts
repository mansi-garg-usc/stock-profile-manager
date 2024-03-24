import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import {
  BehaviorSubject,
  catchError,
  Observable,
  of,
  Subscription,
  switchMap,
  tap,
  throwError,
} from 'rxjs';
import { StockSearchService } from '../../core/services/stock-search.service';
import { TabsComponent } from '../tabs/tabs.component';
import { SimpleChanges } from '@angular/core';
import { StockBuyModalComponent } from '../utility-components/buy-modal/buy-modal.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { StockSellModalComponent } from '../utility-components/sell-modal/sell-modal.component';
import { ActivatedRoute } from '@angular/router';
import { WatchlistService } from '../../core/services/watchlist-service';

@Component({
  selector: 'app-stock-details',
  templateUrl: './stock-details.component.html',
  styleUrls: ['./stock-details.component.css'],
  standalone: true,
  imports: [CommonModule, TabsComponent, StockBuyModalComponent],
})
export class StockDetailsComponent implements OnInit, OnDestroy {
  @Input() stockInfo: any;
  @Input() stockSymbol: string = '';
  @Input() searchStock: any;

  isMarketOpen = new BehaviorSubject<boolean>(false);
  private stockInfoSubject = new BehaviorSubject<any>(null);

  private watchlistSubscription!: Subscription;
  private time: any;
  changePercentage: string = '';
  localWatchlist: string[] = [];
  // direction = true means increase, false means decrease
  direction: boolean = false;
  dateTimestamp: any;
  marketStatusString: string = '';
  isPresentInWatchlist: boolean = false;
  // isPresentInWatchlist: boolean = localStorage
  //   .getItem('watchlist')
  //   ?.includes(`${this.stockSymbol.toUpperCase()}`)
  //   ? true
  //   : false;

  public showTabs: boolean = false;
  private subscription: Subscription = new Subscription();
  moneyInWallet: number = 10000000; //TODO

  constructor(
    private stockSearchService: StockSearchService,
    private activatedRoute: ActivatedRoute,
    private modalService: NgbModal,
    private watchlistService: WatchlistService
  ) {}

  ngOnInit() {
    console.log('calling load watchlist for:', this.stockSymbol);
    this.loadWatchlist();
    this.subscription = this.stockSearchService.exposedSearchResult.subscribe({
      next: (results) => {
        if (results && results.length > 0) {
          this.handleSearchResults(results);
        }
      },
      error: (error) =>
        console.error('Error while fetching stock details:', error),
    });

    this.subscription.add(
      this.activatedRoute.params
        .pipe(
          switchMap((params) => {
            const ticker = params['ticker'];
            if (ticker) {
              return this.stockSearchService.searchStock(ticker); // Ensure searchStock returns an Observable
            }
            return of({});
          })
        )
        .subscribe((results) => {
          if (results && Object.keys(results).length > 0) {
            this.handleSearchResults(results);
          }
        })
    );

    this.watchlistSubscription =
      this.watchlistService.exposedWatchlistEntries.subscribe(
        (watchlistEntries) => {
          console.log('Watchlist entries:', watchlistEntries);
          // Check if the current stock symbol is present in the watchlist
          this.isPresentInWatchlist = watchlistEntries.some(
            (entry: any) => entry?.symbol === this.stockSymbol.toUpperCase()
          );
        }
      );

    // this.setWatchlistEntry();
  }

  handleSearchResults(results: any) {
    if (results && results.length > 0) {
      this.stockInfo = results;
      this.setMarketStatus();
      this.checkChangePercentage(this.stockInfo?.stockPriceDetails?.dp);
      this.dateTimestamp = this.formatDate(
        this.stockInfo?.stockPriceDetails?.t
      );
      this.marketStatusString = this.isMarketOpen.value
        ? 'Market is Open'
        : 'Market is Closed';
      this.showTabs = true;
      this.stockInfoSubject.next(this.stockInfo);
      this.stockSearchService.startPeriodicUpdate(this.stockSymbol);
      this.loadWatchlist(); // Call loadWatchlist here to refresh the watchlist
    }
  }

  openBuyModal() {
    const buyModalReference = this.modalService.open(StockBuyModalComponent);
    buyModalReference.componentInstance.ticker = this.stockSymbol;
    buyModalReference.componentInstance.currentPrice =
      this.stockInfo?.stockPriceDetails?.c;
    buyModalReference.componentInstance.moneyInWallet = this.moneyInWallet;
  }

  openSellModal() {
    const sellModalReference = this.modalService.open(StockSellModalComponent);
    sellModalReference.componentInstance.ticker = this.stockSymbol;
    sellModalReference.componentInstance.currentPrice =
      this.stockInfo?.stockPriceDetails?.c;
  }

  get stockInfo$() {
    return this.stockInfoSubject.asObservable();
  }

  get isMarketOpen$() {
    return this.isMarketOpen?.asObservable();
  }

  ngOnChanges(changes: SimpleChanges) {
    this.stockInfoSubject.next(this.stockInfo);
    this.setMarketStatus();
    if (
      changes['stockSymbol'] &&
      changes['stockSymbol'].currentValue !==
        changes['stockSymbol'].previousValue
    ) {
      this.stockSymbol = changes['stockSymbol'].currentValue.toUpperCase();
      this.updateWatchlistStatus();
    }
    if (this.stockInfo?.hasOwnProperty('companyInfo')) {
      this.checkChangePercentage(this.stockInfo?.stockPriceDetails?.dp);
      this.dateTimestamp = this.formatDate(
        this.stockInfo?.stockPriceDetails?.t
      );
      this.showTabs = true;
      this.marketStatusString = this.isMarketOpen?.value
        ? 'Market is Open'
        : 'Market is Closed';
    }

    //this.loadWatchlist();
    //console.log('Is market open in ngOnChanges:', this.isMarketOpen?.value);
    // React to changes in stockSymbol, especially for a new stock search
    if (
      changes['stockSymbol'] &&
      this.stockSymbol &&
      this.isMarketOpen?.value
    ) {
      this.stockSearchService.startPeriodicUpdate(this.stockSymbol);
      console.log('Periodic update started for symbol:', this.stockSymbol);
    }
  }

  private updateWatchlistStatus(): void {
    // Unsubscribe from the previous subscription if it exists
    if (this.watchlistSubscription) {
      this.watchlistSubscription.unsubscribe();
    }

    // Subscribe to the watchlist entries to update the star status
    this.watchlistSubscription =
      this.watchlistService.exposedWatchlistEntries.subscribe(
        (watchlistEntries) => {
          this.isPresentInWatchlist = watchlistEntries.some(
            (entry: any) => entry.symbol === this.stockSymbol
          );
        }
      );
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    if (this.watchlistSubscription) {
      this.watchlistSubscription.unsubscribe();
    }
    this.stockSearchService.stopPeriodicUpdate();
  }

  checkChangePercentage(value: number) {
    if (value > 0) {
      this.direction = true;
      this.changePercentage = `(${value?.toFixed(2)} %)`;
    } else {
      this.direction = false;
      this.changePercentage = `(${value?.toFixed(2)} %)`;
    }
  }

  formatDate(unixTimeStamp: any) {
    const date = new Date(unixTimeStamp * 1000); // Convert to milliseconds
    const year = date.getUTCFullYear();
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0'); // Month is 0-indexed, add 1 to adjust
    const day = date.getUTCDate().toString().padStart(2, '0');
    const hours = date.getUTCHours().toString().padStart(2, '0');
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    const seconds = date.getUTCSeconds().toString().padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  setMarketStatus() {
    this.time = this.stockInfo?.stockPriceDetails?.t * 1000;
    let currentTime = new Date().getTime();
    let timeDiff = currentTime - this.time;
    let fiveMinutes = 5 * 60 * 1000;
    if (timeDiff < fiveMinutes) {
      this.isMarketOpen?.next(true);
    } else {
      this.isMarketOpen?.next(false);
    }
    //console.log('Is market open:', this.isMarketOpen?.value);
  }

  setWatchlistEntry(): void {
    const watchlistJSON = localStorage.getItem('watchlist');
    const watchlist = watchlistJSON ? JSON.parse(watchlistJSON) : [];
    this.isPresentInWatchlist = watchlist?.includes(
      `${this.stockSymbol.toUpperCase()}`
    )
      ? true
      : false;
  }
  // working
  // toggleWatchlistEntry(): void {
  //   if (!this.isPresentInWatchlist) {
  //     // If the stock symbol is not in the watchlist, add it
  //     this.watchlistService
  //       .addToWatchlist(this.stockSymbol.toUpperCase())
  //       .subscribe({
  //         next: () => {
  //           console.log(`${this.stockSymbol} added to watchlist`);
  //           this.isPresentInWatchlist = true; // Update the flag since the item is now added
  //         },
  //         error: (error) => console.error('Error adding to watchlist:', error),
  //       });
  //   } else {
  //     // If the stock symbol is already in the watchlist, log a message
  //     console.log(`${this.stockSymbol} is already in the watchlist`);
  //   }
  // }

  toggleWatchlistEntry(): void {
    if (this.isPresentInWatchlist) {
      // If the stock symbol is already in the watchlist, remove it
      this.watchlistService
        .removeFromWatchlist(this.stockSymbol.toUpperCase())
        .subscribe({
          next: () => {
            console.log(`${this.stockSymbol} removed from watchlist`);
            this.isPresentInWatchlist = false; // Update the flag since the item is now removed
            // Optionally, refresh the watchlist or perform other UI updates here
          },
          error: (error) =>
            console.error('Error removing from watchlist:', error),
        });
    } else {
      // If the stock symbol is not in the watchlist, add it
      this.watchlistService
        .addToWatchlist(this.stockSymbol.toUpperCase())
        .subscribe({
          next: () => {
            console.log(`${this.stockSymbol} added to watchlist`);
            this.isPresentInWatchlist = true; // Update the flag since the item is now added
            // Optionally, refresh the watchlist or perform other UI updates here
          },
          error: (error) => console.error('Error adding to watchlist:', error),
        });
    }
  }

  // loadWatchlist(): any {
  //   this.watchlistService.fetchWatchlist().subscribe({
  //     next: (watchlist) => {
  //       this.localWatchlist = watchlist;
  //       this.localWatchlist.find(
  //         (item) => item === this.stockSymbol.toUpperCase()
  //       )
  //         ? (this.isPresentInWatchlist = true)
  //         : (this.isPresentInWatchlist = false);
  //       console.log(
  //         'Watchlist from load watchlis in details component:',
  //         this.localWatchlist
  //       );
  //       console.log('Is present in watchlist:', this.isPresentInWatchlist);
  //     },
  //     error: (error: any) => {
  //       // Handle any errors here
  //       console.error('Error loading watchlist:', error);
  //     },
  //   });
  // }

  loadWatchlist(): any {
    this.watchlistService.fetchWatchlist().subscribe({
      next: (watchlist) => {
        // The watchlist might contain more than just symbols. If it does, you should map it to just the symbols.
        this.localWatchlist = watchlist.map((entry) => entry.symbol); // Assuming each entry has a 'symbol' property
        this.isPresentInWatchlist = this.localWatchlist.includes(
          this.stockSymbol.toUpperCase()
        );
        console.log(
          'Watchlist from load watchlist in details component:',
          this.localWatchlist
        );
        console.log('Is present in watchlist:', this.isPresentInWatchlist);
      },
      error: (error: any) => {
        console.error('Error loading watchlist:', error);
      },
    });
  }
  // addToWatchlist(ticker: string): void {
  //   // Call the addToWatchlist method of the WatchlistService
  //   this.watchlistService.getWatchlist().subscribe({
  //     next: (watchlist) => {
  //       if (!watchlist.includes(ticker.toUpperCase())) {
  //         this.localWatchlist.push(ticker.toUpperCase());
  //         this.watchlistService
  //           .addToWatchlist(this.stockSymbol.toUpperCase())
  //           .subscribe({
  //             next: (updatedWatchlist) => {
  //               console.log(
  //                 `Added ${this.stockSymbol.toUpperCase()} to watchlist and updated watchlist is ${updatedWatchlist}`
  //               );
  //               //this.isPresentInWatchlist = true; // Update the flag since the item is now added
  //             },
  //             error: (error: any) => {
  //               // Handle any errors here
  //               console.error('Error adding to watchlist:', error);
  //               // Optionally update isPresentInWatchlist based on error handling logic
  //             },
  //           });
  //         console.log(`Added ${ticker} to watchlist`);
  //         //this.isPresentInWatchlist = true;
  //       }
  //     },
  //     error: (error: any) => {
  //       // Handle any errors here
  //       console.error('Error adding to watchlist:', error);
  //       // Optionally update isPresentInWatchlist based on error handling logic
  //     },
  //   });
  // }

  removeFromWatchlist(ticker: string): void {
    // let watchlist = this.loadWatchlist();
    // if (watchlist.includes(ticker.toUpperCase())) {
    //   watchlist = watchlist.filter(
    //     (item) => item.toUpperCase() !== ticker.toUpperCase()
    //   );
    //   localStorage.setItem('watchlist', JSON.stringify(watchlist));
    //   console.log(`Removed ${ticker} from watchlist`);
    // }
    // this.isPresentInWatchlist = false;
    console.log('Remove from watchlist ckicked for :', ticker);
  }
}
