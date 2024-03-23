import { Component } from '@angular/core';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
  RouterEvent,
  RouterOutlet,
} from '@angular/router';
import { FooterComponent } from './components/footer/footer.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { StockDetailsComponent } from './components/stock-details/stock-details.component';
import { StockSearchComponent } from './components/stock-search/stock-search.component';
import { TabsComponent } from './components/tabs/tabs.component';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  imports: [
    RouterOutlet,
    NavbarComponent,
    StockSearchComponent,
    TabsComponent,
    FooterComponent,
    StockDetailsComponent,
  ],
})
export class AppComponent {
  title = 'stock-portfolio-manager';

  constructor(private router: Router) {
    this.router.events
      .pipe(
        // Use 'filter' to allow only RouterEvent instances
        filter(
          (event: any): event is RouterEvent =>
            event instanceof NavigationStart ||
            event instanceof NavigationEnd ||
            event instanceof NavigationCancel ||
            event instanceof NavigationError
        )
      )
      .subscribe((event: RouterEvent) => {
        if (event instanceof NavigationStart) {
          console.log('Navigation Start:', event);
        } else if (event instanceof NavigationEnd) {
          console.log('Navigation End:', event.url);
        } else if (event instanceof NavigationCancel) {
          console.log('Navigation Cancel:', event);
        } else if (event instanceof NavigationError) {
          console.log('Navigation Error:', event);
        }
      });
  }
}
