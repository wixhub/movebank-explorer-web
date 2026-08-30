import { Component, inject, signal, computed } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { of, map, catchError } from 'rxjs';
import { DatasetService } from '../../core/services/dataset.service';
import { Dataset } from '../../core/models/dataset.model';
import { Footer } from '../../core/layout/footer/footer';

@Component({
  selector: 'app-dataset-catalog',
  imports: [Footer],
  templateUrl: './dataset-catalog.html',
  styleUrl: './dataset-catalog.scss',
})
export class DatasetCatalog {
  private readonly datasetService = inject(DatasetService);

  // Component state signals replacing the form group
  readonly aiPrompt = signal('');
  readonly entityType = signal('study');
  readonly studyId = signal('');

  // Extended query params signal to support filters parsed from AI
  private readonly queryParams = signal<
    | { type: 'mock' }
    | { type: 'live'; entityType: string; studyId?: string; filters?: Record<string, string> }
  >({
    type: 'mock',
  });

  // Simple writable signal for the error banner
  readonly errorMessage = signal<string | null>(null);

  // Modern rxResource stream handling errors and fallback cards correctly
  readonly datasetsResource = rxResource({
    params: this.queryParams,
    stream: ({ params }) => {
      if (params.type === 'mock') {
        this.errorMessage.set(null);
        return this.datasetService.getLocalDatasets().pipe(catchError(() => of([])));
      }

      return this.datasetService
        .getCustomMovebankData(params.entityType, params.studyId, params.filters)
        .pipe(
          map((data) => {
            // Check if the service returned the error notice card
            const isErrorCard = data.length === 1 && data[0].id === 'error-notice';
            if (isErrorCard) {
              this.errorMessage.set(data[0].abstract);
            } else {
              this.errorMessage.set(null);
            }
            return data;
          }),
          catchError((err) => {
            const errorMsg =
              err instanceof Error
                ? err.message
                : 'Failed to fetch live data from Movebank. This study may require explicit license agreement acceptance.';
            this.errorMessage.set(errorMsg);

            // Return the fallback error card so it displays in the list alongside the banner
            return of([
              {
                id: 'error-notice',
                title: 'Movebank Access Restriction Notice',
                doi: params.studyId ? `Study ID: ${params.studyId}` : 'Direct-Read Endpoint',
                abstract: errorMsg,
                authors: ['System Proxy Gateway'],
                discipline: 'Wildlife Telemetry',
                format: 'API Error State',
                fileSize: '0 KB',
                publicationDate: new Date().toISOString().split('T')[0],
                license: 'CC0',
                tags: ['API Error', 'Restricted Data'],
                downloadsCount: 0,
              },
            ]);
          }),
        );
    },
  });

  // Convenience computed signals for template binding
  readonly datasets = computed(() => this.datasetsResource.value() ?? []);
  readonly isLoading = computed(() => this.datasetsResource.isLoading());

  readonly errorMessag = computed(() => {
    const err = this.datasetsResource.error();
    if (!err) return null;

    // 1. If it's a standard Error or has a message property
    if (err instanceof Error) return err.message;
    if (typeof err === 'object' && err !== null) {
      // Check Angular HttpErrorResponse structure (err.error?.details or err.error?.error or err.message)
      const errObj = err as Record<string, unknown>;
      if (typeof errObj['message'] === 'string' && errObj['message']) {
        return errObj['message'];
      }
      if (errObj['error'] && typeof errObj['error'] === 'object') {
        const innerError = errObj['error'] as Record<string, unknown>;
        if (typeof innerError['details'] === 'string') return innerError['details'];
        if (typeof innerError['error'] === 'string') return innerError['error'];
      }
    }

    // 2. Fallback to string conversion or generic text
    const stringified = String(err);
    return stringified && stringified !== '[object Object]'
      ? stringified
      : 'Failed to fetch live data from Movebank.';
  });

  // Helper signal for UI highlighting in template buttons ('live' or 'mock')
  readonly activeSource = computed(() => this.queryParams().type);

  /**
   * Loads local static JSON data from the public folder.
   */
  loadMockData(): void {
    this.queryParams.set({ type: 'mock' });
  }

  /**
   * Fetches real live data based on signal values.
   */
  loadCustomLiveQuery(): void {
    this.queryParams.set({
      type: 'live',
      entityType: this.entityType(),
      studyId: this.studyId() ? this.studyId() : undefined,
    });
  }

  resetFilters(): void {
    this.aiPrompt.set('');
    this.entityType.set('study');
    this.studyId.set('');
    this.errorMessage.set(null);
  }

  /**
   * Sends natural language prompt to the AI worker, parses structured response,
   * updates component signals and automatically triggers live query execution.
   */
  onAiSearch(): void {
    const prompt = this.aiPrompt();
    if (!prompt) return;

    this.datasetService.askAiAssistant(prompt).subscribe({
      next: (response) => {
        try {
          const filters = response.filters || {};
          let resolvedStudyId = filters['study_id'] || '';
          let resolvedEntity = response.entity_type || 'study';

          const taxonName = filters['taxon_canonical_name'];
          if (!resolvedStudyId && taxonName === 'Ciconia ciconia') {
            resolvedStudyId = '2911276';
            resolvedEntity = 'event';
            filters['sensor_type_id'] = '653'; // Required sensor type for event queries
          }

          this.entityType.set(resolvedEntity);
          this.studyId.set(resolvedStudyId);

          this.queryParams.set({
            type: 'live',
            entityType: resolvedEntity,
            studyId: resolvedStudyId ? resolvedStudyId : undefined,
            filters: filters,
          });
        } catch (e) {
          console.error('Failed to process AI response', e);
          this.loadCustomLiveQuery();
        }
      },
      error: (err) => {
        console.error('AI assistant request failed', err);
      },
    });
  }
}
