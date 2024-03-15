import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-stock-details',
  templateUrl: './stock-details.component.html',
  styleUrls: ['./stock-details.component.css'],
  standalone: true,
  imports: [CommonModule], // Remove the imports array
})
export class StockDetailsComponent {
  @Input() stockData: any; // Adjust the type as needed
}
