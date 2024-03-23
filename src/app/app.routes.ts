import { Routes } from '@angular/router';
import { StockDetailsComponent } from './components/stock-details/stock-details.component';
import { StockSearchComponent } from './components/stock-search/stock-search.component';

export const routes: Routes = [
  { path: 'search/home', component: StockSearchComponent },
  { path: 'search/:ticker', component: StockDetailsComponent },
  { path: '', redirectTo: '/search/home', pathMatch: 'full' },
  // { path: 'watchlist', component: WatchlistComponent },
  // { path: 'portfolio', component: PortfolioComponent },
];
