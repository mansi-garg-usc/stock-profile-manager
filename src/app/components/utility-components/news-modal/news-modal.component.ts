import { Component, Input, ViewChild } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-news-modal',
  standalone: true,
  imports: [],
  templateUrl: './news-modal.component.html',
  styleUrl: './news-modal.component.css'
})
export class NewsModalComponent {
  @Input() source!: string;
  @Input() datetime!: number;
  @Input() headline!: string;
  @Input() summary!: string;
  @Input() url!: string;
  @ViewChild('newsModal') newsModal: any;

  constructor(private modalService: NgbModal) {}

  closeModal() {
    this.modalService.dismissAll()
  }
}
