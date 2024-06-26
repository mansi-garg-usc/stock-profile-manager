import { Routes } from '@angular/router';
import { StockDetailsComponent } from './components/stock-details/stock-details.component';
import { StockSearchComponent } from './components/stock-search/stock-search.component';
import { WatchlistComponent } from './components/watchlist/watchlist.component';
import { PortfolioComponent } from './components/portfolio/portfolio.component';

const routes: Routes = [
  // { path: 'search/home', component: StockSearchComponent },
  // { path: '', component: StockSearchComponent },
  { path: '', redirectTo: '/search/home', pathMatch: 'full' },
  { path: 'search/:ticker', component: StockSearchComponent },
  { path: 'watchlist', component: WatchlistComponent },
  { path: 'portfolio', component: PortfolioComponent },
];

export default routes;
