import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { StockSearchComponent } from './components/stock-search/stock-search.component';
import { TabsComponent } from './components/tabs/tabs.component';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  imports: [RouterOutlet, StockSearchComponent, TabsComponent],
})
export class AppComponent {
  title = 'stock-portfolio-manager';
}
