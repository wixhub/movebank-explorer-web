import { TestBed } from '@angular/core/testing';
import { ApplicationRef } from '@angular/core';
import { of, throwError } from 'rxjs';
import { DatasetCatalog } from './dataset-catalog';
import { DatasetService } from '../../core/services/dataset.service';
import { Dataset } from '../../core/models/dataset.model';

describe('DatasetCatalog', () => {
  let serviceMock: {
    getLocalDatasets: ReturnType<typeof vi.fn>;
    getCustomMovebankData: ReturnType<typeof vi.fn>;
    askAiAssistant: ReturnType<typeof vi.fn>;
  };

  const mockDataset: Dataset = {
    id: 'mock-1',
    title: 'Mock Dataset',
    doi: '10.5061/dryad.123',
    abstract: 'Sample abstract',
    authors: ['Author One'],
    discipline: 'Wildlife Telemetry',
    format: 'CSV',
    fileSize: '1 MB',
    publicationDate: '2026-01-01',
    license: 'CC0',
    tags: ['Telemetry'],
    downloadsCount: 100,
  };

  beforeEach(async () => {
    serviceMock = {
      getLocalDatasets: vi.fn().mockReturnValue(of([mockDataset])),
      getCustomMovebankData: vi
        .fn()
        .mockReturnValue(of([{ ...mockDataset, id: 'live-1', title: 'Live Dataset' }])),
      askAiAssistant: vi
        .fn()
        .mockReturnValue(of({ entity_type: 'study', filters: { study_id: '123' } })),
    };

    await TestBed.configureTestingModule({
      imports: [DatasetCatalog],
      providers: [{ provide: DatasetService, useValue: serviceMock }],
    }).compileComponents();
  });

  it('should create component and load mock data by default', async () => {
    const fixture = TestBed.createComponent(DatasetCatalog);
    const component = fixture.componentInstance;

    fixture.detectChanges();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(component).toBeTruthy();
    expect(serviceMock.getLocalDatasets).toHaveBeenCalled();
    expect(component.datasets().length).toBe(1);
    expect(component.activeSource()).toBe('mock');
  });

  it('should switch to live data query correctly', async () => {
    const fixture = TestBed.createComponent(DatasetCatalog);
    const component = fixture.componentInstance;

    component.entityType.set('event');
    component.studyId.set('999');
    component.loadCustomLiveQuery();

    fixture.detectChanges();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(serviceMock.getCustomMovebankData).toHaveBeenCalledWith('event', '999', undefined);
    expect(component.activeSource()).toBe('live');
  });

  it('should handle live data errors and display error fallback notice', async () => {
    serviceMock.getCustomMovebankData.mockReturnValueOnce(
      throwError(() => new Error('Connection timeout')),
    );

    const fixture = TestBed.createComponent(DatasetCatalog);
    const component = fixture.componentInstance;

    component.loadCustomLiveQuery();
    fixture.detectChanges();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(component.errorMessage()).toBe('Connection timeout');
    expect(component.datasets().length).toBe(1);
    expect(component.datasets()[0].id).toBe('error-notice');
  });

  it('should reset all filters and signals properly', async () => {
    const fixture = TestBed.createComponent(DatasetCatalog);
    const component = fixture.componentInstance;

    component.aiPrompt.set('Find white storks');
    component.entityType.set('event');
    component.studyId.set('12345');
    component.errorMessage.set('Some error');

    component.resetFilters();

    expect(component.aiPrompt()).toBe('');
    expect(component.entityType()).toBe('study');
    expect(component.studyId()).toBe('');
    expect(component.errorMessage()).toBeNull();
  });

  it('should process AI search response and update query params', async () => {
    const fixture = TestBed.createComponent(DatasetCatalog);
    const component = fixture.componentInstance;

    component.aiPrompt.set('Get Ciconia ciconia data');
    serviceMock.askAiAssistant.mockReturnValueOnce(
      of({ entity_type: 'study', filters: { taxon_canonical_name: 'Ciconia ciconia' } }),
    );

    component.onAiSearch();
    fixture.detectChanges();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(serviceMock.askAiAssistant).toHaveBeenCalledWith('Get Ciconia ciconia data');
    expect(component.studyId()).toBe('2911276');
    expect(component.entityType()).toBe('event');
    expect(component.activeSource()).toBe('live');
  });
});
