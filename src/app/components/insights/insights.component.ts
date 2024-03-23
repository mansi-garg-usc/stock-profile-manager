import { Component, Input } from '@angular/core';
import { Observable, of } from 'rxjs';

@Component({
  selector: 'app-insights',
  standalone: true,
  imports: [],
  templateUrl: './insights.component.html',
  styleUrl: './insights.component.css',
})
export class InsightsComponent {
  @Input() stockInfo$: Observable<any> = of(null);
  @Input() isMarketOpen$: Observable<boolean> = of(false);
  @Input() stockSymbol: string = '';
}
