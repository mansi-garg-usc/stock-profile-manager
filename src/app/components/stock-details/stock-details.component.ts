import { CommonModule } from '@angular/common';
import {
  Component,
  Input,
  OnDestroy,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import {
  BehaviorSubject,
  catchError,
  finalize,
  of,
  Subscription,
  switchMap,
  tap,
} from 'rxjs';
import { PortfolioService } from '../../core/services/portfolio.service';
import { StockSearchService } from '../../core/services/stock-search.service';
import { WatchlistService } from '../../core/services/watchlist-service';
import { TabsComponent } from '../tabs/tabs.component';
import { StockBuyModalComponent } from '../utility-components/buy-modal/buy-modal.component';
import { StockSellModalComponent } from '../utility-components/sell-modal/sell-modal.component';

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
  isPresentInPortfolio: boolean = false;
  indexInWatchlist: number = -1;
  displayBuyAlert = false;
  displaySellAlert = false;
  portfolioData: any = [];
  canSellStock: boolean = false;
  canSellStock$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  isLoading: boolean = true;
  displayAddedToWatchlistAlert: boolean = false;
  displayRemovedFromWatchlistAlert: boolean = false;
  currentDate = new Date();
  currentDateFormatted = this.formatTodayDate(this.currentDate);
  invalidEntry: boolean = false;
  displayDetails = false;
  cachedWatchlistData: any = null;
  cachedPortfolioData: any = null;

  public showTabs: boolean = false;
  private subscription: Subscription = new Subscription();
  // moneyInWallet: number = 10000000; //TODO

  constructor(
    private stockSearchService: StockSearchService,
    private activatedRoute: ActivatedRoute,
    private modalService: NgbModal,
    private watchlistService: WatchlistService,
    private portfolioService: PortfolioService
  ) {}

  sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  formatTodayDate(dateToBeFormatted: Date) {
    const year = dateToBeFormatted.getFullYear();
    const month = (dateToBeFormatted.getMonth() + 1)
      .toString()
      .padStart(2, '0');
    const day = dateToBeFormatted.getDate().toString().padStart(2, '0');
    const hours = dateToBeFormatted.getHours().toString().padStart(2, '0');
    const minutes = dateToBeFormatted.getMinutes().toString().padStart(2, '0');
    const seconds = dateToBeFormatted.getSeconds().toString().padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  async ngOnInit() {
    let cachedData = this.stockSearchService.getPreviousRouteData();
    let cachedWatchlist = this.watchlistService.getPreviousWatchlistRouteData();
    // let cachedPortfolio = null;
    // let cachedPortfolioData = null;
    // let cachedPortfolio = this.portfolioService.getPreviousPortfolioRouteData();
    // console.log(
    //   'mansi cached portfolio in details component:',
    //   cachedPortfolio
    // );
    let cachedTicker = cachedData !== null ? cachedData.stocksymbol : null;
    this.cachedWatchlistData =
      cachedWatchlist !== null ? cachedWatchlist : null;
    // this.cachedPortfolioData =
    //   cachedPortfolio !== null ? cachedPortfolio.portfoliodata : null;
    this.invalidEntry = false;
    this.isLoading = true;

    // await this.sleep(500); // Simulated loading time

    // Load the watchlist initially
    this.loadWatchlist();

    this.loadPortfolio();

    // Subscription to handle route parameters and fetch stock details
    this.subscription.add(
      this.activatedRoute.params
        .pipe(
          tap(() => {
            this.isLoading = true; // Ensure loader is displayed when starting to fetch new data
            this.displayAddedToWatchlistAlert = false;
            this.displayRemovedFromWatchlistAlert = false;
          }),
          switchMap((params) => {
            const ticker = params['ticker'];
            if (ticker !== this.stockSymbol && cachedTicker === null) {
              return this.stockSearchService.searchStock(ticker);
            } else if (cachedData !== null) {
              return of(cachedData);
            } else {
              return of(null);
            } // Return null or an appropriate value if no ticker is provided
          }),
          tap((results) => {
            // Handle the stock search results
            if (
              results &&
              Object.keys(results).length > 0 &&
              results !== null
            ) {
              this.handleSearchResults(results);
            } else {
              // this.stockInfo = null;
              // this.invalidEntry = true; // Handle the case where no results are found or an invalid ticker is provided
            }
          }), // Fetch portfolio data after handling stock search results
          catchError((error) => {
            console.error('Error during data fetching thisss:', error);
            // this.invalidEntry = true;
            return of(null); // Handle errors and continue the observable chain
          }),
          switchMap(() => this.portfolioService.getPortfolio()), // Fetch portfolio data after handling stock search results
          catchError((error) => {
            console.error('Error during data fetching:', error);
            // this.invalidEntry = true;
            return of(null); // Handle errors and continue the observable chain
          }),
          finalize(() => (this.isLoading = false)) // Ensure the loader is hidden after all operations are complete
        )
        .subscribe((portfolioData) => {
          // Handle portfolio data
          if (portfolioData) {
            this.portfolioData = portfolioData;
            this.isPresentInPortfolio = portfolioData.some(
              (entry) => entry?.stocksymbol === this.stockSymbol.toUpperCase()
            );
          }
        })
    );

    // Subscription to watchlist changes
    this.watchlistSubscription =
      this.watchlistService.exposedWatchlistEntries.subscribe(
        (watchlistEntries) => {
          this.isPresentInWatchlist = watchlistEntries.some(
            (entry: any) => entry?.symbol === this.stockSymbol.toUpperCase()
          );
        }
      );
  }

  handleSearchResults(results: any) {
    if (results && results.length > 0 && this.stockSymbol !== '') {
      this.isLoading = false;
      this.currentDateFormatted = this.formatTodayDate(new Date());
      this.stockInfo = results;
      this.setMarketStatus();
      this.checkChangePercentage(this.stockInfo?.stockPriceDetails?.dp);
      this.dateTimestamp = this.formatDate(
        this.stockInfo?.stockPriceDetails?.t
      );
      this.marketStatusString = this.isMarketOpen.value
        ? 'Market is Open'
        : `Market closed on ${this.dateTimestamp}`;
      this.showTabs = true;
      this.stockInfoSubject.next(this.stockInfo);
      this.stockSearchService.startPeriodicUpdate(this.stockSymbol);
      this.loadWatchlist();
      this.loadPortfolio();
      // this.isLoading = false;
    } else {
      this.isLoading = false;
      // this.stockInfoSubject.next(null);
      // this.invalidEntry = true;
    }
  }

  openBuyModal() {
    this.displayBuyAlert = false;
    this.displaySellAlert = false;
    const buyModalReference = this.modalService.open(StockBuyModalComponent);
    buyModalReference.componentInstance.stocksymbol = this.stockSymbol;
    buyModalReference.componentInstance.currentPrice =
      this.stockInfo?.stockPriceDetails?.c;
    buyModalReference.componentInstance.stockPresentInPortfolio =
      this.isPresentInPortfolio;
    buyModalReference.componentInstance.stockIndexInPortfolio =
      this.indexInWatchlist;
    buyModalReference.componentInstance.currentPortfolioData =
      this.portfolioData;
    buyModalReference.result.then(
      (result) => {
        this.displayBuyAlert = true;
        this.canSellStock$.next(result);
        this.refreshPortfolioData();
      },
      (reason) => {}
    );

    //TODO: Add the current portfolio data
  }

  openSellModal() {
    this.displayBuyAlert = false;
    this.displaySellAlert = false;
    const sellModalReference = this.modalService.open(StockSellModalComponent);
    sellModalReference.componentInstance.stocksymbol = this.stockSymbol;
    sellModalReference.componentInstance.currentPrice =
      this.stockInfo?.stockPriceDetails?.c;
    sellModalReference.componentInstance.currentPortfolioData =
      this.portfolioData;
    //TODO: Add the current portfolio data
    sellModalReference.result.then(
      (result) => {
        this.displaySellAlert = true;
        this.refreshPortfolioData();
      },
      (reason) => {}
    );
  }

  refreshPortfolioData() {
    this.cachedPortfolioData = [];
    this.portfolioService.getPortfolio().subscribe({
      next: (data) => {
        this.portfolioData = data;
        if (this.portfolioData.length > 0) {
          this.portfolioData.some((entry: any) => {
            if (entry?.stocksymbol === this.stockSymbol.toUpperCase()) {
              this.isPresentInPortfolio = true;
              this.indexInWatchlist = this.portfolioData.indexOf(entry);
            } else {
              this.isPresentInPortfolio = false;
            }
          });
        } else {
          this.isPresentInPortfolio = false;
          this.indexInWatchlist = -1;
        }
      },
      error: (error) => {
        console.error('Error refreshing portfolio data:', error);
      },
    });
  }

  get stockInfo$() {
    return this.stockInfoSubject.asObservable();
  }

  get isMarketOpen$() {
    return this.isMarketOpen?.asObservable();
  }

  ngOnChanges(changes: SimpleChanges) {
    this.isLoading = true;
    if (
      (this.stockInfo && this.stockInfo?.stockPriceDetails !== undefined) ||
      null
    ) {
      this.stockInfoSubject.next(this.stockInfo);
      this.currentDateFormatted = this.formatTodayDate(new Date());
      if (
        changes['stockSymbol'] &&
        changes['stockSymbol'].currentValue !==
          changes['stockSymbol'].previousValue
      ) {
        this.setMarketStatus();
        this.stockSymbol = changes['stockSymbol'].currentValue.toUpperCase();
        this.updateWatchlistStatus();
        this.isLoading = false;
      }
      if (this.stockInfo?.hasOwnProperty('companyInfo')) {
        // this.setMarketStatus();
        this.checkChangePercentage(this.stockInfo?.stockPriceDetails?.dp);
        this.dateTimestamp = this.convertEpochToPST(
          this.stockInfo?.stockPriceDetails?.t
        );
        let dateForMarketStatus = new Date(
          this.stockInfo?.stockPriceDetails?.t * 1000
        );

        const year = dateForMarketStatus.getFullYear().toString();
        const month = (dateForMarketStatus.getMonth() + 1)
          .toString()
          .padStart(2, '0');
        const day = dateForMarketStatus.getDate().toString().padStart(2, '0');
        this.showTabs = true;
        this.marketStatusString = this.isMarketOpen?.value
          ? 'Market is Open'
          : `Market closed on ${year}-${month}-${day} 13:00:00`;
        this.isLoading = false;
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
      }
    }
    // this.isLoading = false;
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
            (entry: any) => entry.symbol === this.stockSymbol.toUpperCase()
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
    const date = new Date(unixTimeStamp * 1000);
    const year = date.getFullYear().toString();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  convertEpochToPST(epoch: number): string {
    const date = new Date(epoch * 1000);
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: 'America/Los_Angeles',
    };

    let formattedDate = date.toLocaleString('en-US', options);
    formattedDate = formattedDate.replace(
      /(\d{2})\/(\d{2})\/(\d{4}),/,
      '$3-$1-$2'
    ); // Adjust format to MM-DD-YYYY

    return formattedDate;
  }

  setMarketStatus(): boolean {
    // Ensure stockInfo and stockPriceDetails are defined and contain a valid timestamp
    if (
      !this.stockInfo ||
      !this.stockInfo?.stockPriceDetails ||
      !this.stockInfo?.stockPriceDetails?.t
    ) {
      console.error('Invalid or missing timestamp');
      return false;
    }

    const timestamp = this.stockInfo?.stockPriceDetails?.t * 1000;
    const date = new Date(timestamp);
    const todayDate = new Date();

    if (isNaN(date.getTime())) {
      // Check if date is invalid
      console.error('Invalid date created from timestamp');
      return false;
    }

    // Convert the date to Eastern Time
    const options: Intl.DateTimeFormatOptions = {
      //timeZone: 'America/New_York', // Uncomment to set time zone
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
    };
    const dateFormatter = new Intl.DateTimeFormat('en-US', options);
    const [hours, minutes] = dateFormatter.format(date).split(':').map(Number);

    // Get the day of the week (0 for Sunday, 1 for Monday, ..., 6 for Saturday)
    const dayOfWeek = date.getDay();
    const dateOfData = date.getDate();
    const monthOfData = date.getMonth() + 1;
    const dateOfToday = todayDate.getDate();
    const monthOfToday = todayDate.getMonth() + 1;

    const isDayInPast = dateOfData < dateOfToday || monthOfData < monthOfToday;
    // Define market open and close hours
    const marketOpenHour = 6; // 9:30 AM in Eastern Time
    const marketOpenMinute = 30;
    const marketCloseHour = 13; // 4:00 PM in Eastern Time
    const marketCloseMinute = 0;

    // Check if the day is between Monday and Friday
    const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;

    // Check if the time is between market open and close times
    const isTimeWithinMarketHours =
      (hours > marketOpenHour ||
        (hours === marketOpenHour && minutes >= marketOpenMinute)) &&
      (hours < marketCloseHour ||
        (hours === marketCloseHour && minutes < marketCloseMinute));

    if (!isDayInPast && isWeekday && isTimeWithinMarketHours) {
      this.isMarketOpen.next(true);
      return true;
    } else {
      this.isMarketOpen.next(false);
      return false;
    }
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

  toggleWatchlistEntry(): void {
    if (this.isPresentInWatchlist) {
      // If the stock symbol is already in the watchlist, remove it
      this.watchlistService
        .removeFromWatchlist(this.stockSymbol.toUpperCase())
        .subscribe({
          next: () => {
            this.isPresentInWatchlist = false; // Update the flag since the item is now removed
            this.displayRemovedFromWatchlistAlert = true;
            if (this.cachedWatchlistData !== null) {
              this.cachedWatchlistData = null;
              this.loadWatchlist();
            }
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
            this.isPresentInWatchlist = true; // Update the flag since the item is now added
            this.displayAddedToWatchlistAlert = true;

            if (this.cachedWatchlistData !== null) {
              this.cachedWatchlistData = null;
              this.loadWatchlist();
            }
            // Optionally, refresh the watchlist or perform other UI updates here
          },
          error: (error) => console.error('Error adding to watchlist:', error),
        });
    }
  }

  loadWatchlist(): any {
    if (this.cachedWatchlistData === null) {
      this.watchlistService.fetchWatchlist().subscribe({
        next: (watchlist) => {
          // The watchlist might contain more than just symbols. If it does, you should map it to just the symbols.
          this.localWatchlist = watchlist.map((entry) => entry.symbol); // Assuming each entry has a 'symbol' property
          this.isPresentInWatchlist = this.localWatchlist.includes(
            this.stockSymbol.toUpperCase()
          );
        },
        error: (error: any) => {
          console.error('Error loading watchlist:', error);
        },
      });
    } else {
      this.localWatchlist = this.cachedWatchlistData.watchlistentries;
      this.isPresentInWatchlist =
        this.cachedWatchlistData.watchlistentries.includes(
          this.stockSymbol.toUpperCase()
        );
    }
  }

  loadPortfolio(): any {
    this.portfolioService.getPortfolio().subscribe({
      next: (portfolioData) => {
        this.portfolioData = portfolioData;
        this.isPresentInPortfolio = portfolioData.some(
          (entry: any) => entry?.stocksymbol === this.stockSymbol.toUpperCase()
        );
        console.log(
          'Portfolio data from load portfolio in details component:',
          this.portfolioData
        );
        console.log(
          'Is present in portfolio in details component:',
          this.isPresentInPortfolio
        );
      },
      error: (error: any) => {
        console.error('Error loading portfolio:', error);
      },
    });
  }
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
