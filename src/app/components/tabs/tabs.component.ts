import { Component } from '@angular/core';
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { MatTabsModule } from '@angular/material/tabs';
import { SummaryComponent } from '../summary/summary.component';
import { TopNewsComponent } from '../top-news/top-news.component';
import { InsightsComponent } from '../insights/insights.component';
import { ChartsComponent } from '../charts/charts.component';

@Component({
  selector: 'app-tabs',
  standalone: true,
  imports: [
    NgbNavModule,
    MatTabsModule,
    SummaryComponent,
    TopNewsComponent,
    InsightsComponent,
    ChartsComponent,
  ], // Import the NgbNavModule here
  templateUrl: './tabs.component.html',
  styleUrls: ['./tabs.component.css'],
})
export class TabsComponent {
  // Your component logic
}
