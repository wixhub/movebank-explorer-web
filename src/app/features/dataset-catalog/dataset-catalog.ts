import { Component, inject, signal, computed } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { rxResource } from '@angular/core/rxjs-interop';
import { of, map, catchError } from 'rxjs';
import { DatasetService } from '../../core/services/dataset.service';
import { Dataset } from '../../core/models/dataset.model';

@Component({
  selector: 'app-dataset-catalog',
  imports: [ReactiveFormsModule],
  templateUrl: './dataset-catalog.html',
  styleUrl: './dataset-catalog.scss',
})
export class DatasetCatalog {
  private readonly datasetService = inject(DatasetService);
  private readonly fb = inject(NonNullableFormBuilder);

  // Form group for dynamic Movebank API parameters selection
  readonly queryForm = this.fb.group({
    entityType: ['study'],
    studyId: [''],
  });

  // Reactive trigger signal to switch between mock data and live query parameters.
  // Set to 'mock' by default so mock datasets load on initial app start.
  private readonly queryParams = signal<
    { type: 'mock' } | { type: 'live'; entityType: string; studyId: string }
  >({
    type: 'mock',
  });

  // Modern rxResource pattern connecting service observables to signals
  readonly datasetsResource = rxResource({
    params: this.queryParams,
    stream: ({ params }) => {
      if (params.type === 'mock') {
        return this.datasetService.getLocalDatasets().pipe(catchError(() => of([] as Dataset[])));
      }

      return this.datasetService.getCustomMovebankData(params.entityType, params.studyId).pipe(
        map((data) => data),
        catchError(() => of([] as Dataset[])),
      );
    },
  });

  // Convenience computed signals for template binding
  readonly datasets = computed(() => this.datasetsResource.value() ?? []);
  readonly isLoading = computed(() => this.datasetsResource.isLoading());

  readonly errorMessage = computed(() => {
    const err = this.datasetsResource.error();
    if (!err) return null;
    return typeof err === 'object' && err !== null && 'message' in err
      ? String((err as { message: unknown }).message)
      : String(err);
  });

  // Helper signal for UI highlighting in template buttons ('live' or 'mock')
  readonly activeSource = computed(() => this.queryParams().type);

  /**
   * Loads local static JSON data from the public folder
   */
  loadMockData(): void {
    this.queryParams.set({ type: 'mock' });
  }

  /**
   * Fetches real live data based on user-selected dynamic parameters from the form
   */
  loadCustomLiveQuery(): void {
    const { entityType, studyId } = this.queryForm.getRawValue();
    this.queryParams.set({ type: 'live', entityType, studyId });
  }
}
