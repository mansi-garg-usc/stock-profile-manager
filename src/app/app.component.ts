import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar.component';
import { StockSearchComponent } from './components/stock-search/stock-search.component';
import { TabsComponent } from './components/tabs/tabs.component';
import { FooterComponent } from './components/footer/footer.component';

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
  ],
})
export class AppComponent {
  title = 'stock-portfolio-manager';
}
