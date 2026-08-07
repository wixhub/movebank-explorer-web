import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { signal } from '@angular/core';
import { DatasetService } from '../../core/services/dataset.service';
import { Dataset } from '../../core/models/dataset.model';

@Component({
  selector: 'app-dataset-catalog',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './dataset-catalog.html',
  styleUrl: './dataset-catalog.scss',
})
export class DatasetCatalog implements OnInit {
  private datasetService = inject(DatasetService);
  private fb = inject(FormBuilder);

  // Reactive signals for component state
  datasets = signal<Dataset[]>([]);
  isLoading = signal<boolean>(false);
  activeSource = signal<'mock' | 'live'>('mock');
  errorMessage = signal<string | null>(null);

  // Form group for dynamic Movebank API parameters selection
  queryForm: FormGroup = this.fb.group({
    entityType: ['study'],
    studyId: [''],
  });

  ngOnInit(): void {
    this.loadMockData();
  }

  /**
   * Loads local static JSON data from the public folder
   */
  loadMockData(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.activeSource.set('mock');

    this.datasetService.getLocalDatasets().subscribe({
      next: (data) => {
        this.datasets.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set('Failed to load local mock data.');
        this.isLoading.set(false);
      },
    });
  }

  /**
   * Fetches real live data based on user-selected dynamic parameters from the form
   */
  loadCustomLiveQuery(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.activeSource.set('live');

    const { entityType, studyId } = this.queryForm.value;

    this.datasetService.getCustomMovebankData(entityType, studyId).subscribe({
      next: (data) => {
        if (data.length > 0) {
          this.datasets.set(data);
        } else {
          // Clear previous results when no data is returned
          this.datasets.set([]);
          this.errorMessage.set('Live API returned no data for selected parameters.');
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        // Clear previous results on error as well
        this.datasets.set([]);
        this.errorMessage.set('Error connecting to Movebank Live API.');
        this.isLoading.set(false);
      },
    });
  }
}
