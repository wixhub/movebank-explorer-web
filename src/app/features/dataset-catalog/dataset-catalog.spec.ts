import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { DatasetCatalog } from './dataset-catalog';
import { DatasetService } from '../../core/services/dataset.service';
import { Dataset } from '../../core/models/dataset.model';

describe('DatasetCatalog', () => {
  let component: DatasetCatalog;
  let fixture: ComponentFixture<DatasetCatalog>;
  let datasetServiceMock: {
    getLocalDatasets: ReturnType<typeof vi.fn>;
    getCustomMovebankData: ReturnType<typeof vi.fn>;
  };

  const mockDatasets: Dataset[] = [
    {
      id: '1',
      title: 'Mock Dataset 1',
      doi: '10.1234/test',
      abstract: 'Abstract for test dataset',
      authors: ['Author One'],
      discipline: 'Ecology',
      format: 'JSON',
      fileSize: '5MB',
      publicationDate: '2026-01-01',
      license: 'CC0',
      tags: ['Test'],
      downloadsCount: 150,
    },
  ];

  beforeEach(async () => {
    // Mock DatasetService methods used by rxResource inside the component
    datasetServiceMock = {
      getLocalDatasets: vi.fn().mockReturnValue(of(mockDatasets)),
      getCustomMovebankData: vi.fn().mockReturnValue(of(mockDatasets)),
    };

    await TestBed.configureTestingModule({
      imports: [DatasetCatalog],
      providers: [{ provide: DatasetService, useValue: datasetServiceMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(DatasetCatalog);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  /**
   * Test case to verify that the component instance is successfully created
   */
  it('should create', () => {
    expect(component).toBeTruthy();
  });

  /**
   * Test case to verify that the form initializes correctly with default values
   */
  it('should initialize query form with default values', () => {
    const formValue = component.queryForm.getRawValue();
    expect(formValue).toEqual({
      entityType: 'study',
      studyId: '',
    });
  });

  /**
   * Test case to verify switching to local mock data source
   */
  it('should switch to mock data source when loadMockData is called', async () => {
    component.loadMockData();
    await fixture.whenStable();

    expect(component.activeSource()).toBe('mock');
    expect(component.datasets()).toEqual(mockDatasets);
    expect(datasetServiceMock.getLocalDatasets).toHaveBeenCalled();
  });

  /**
   * Test case to verify calling getCustomMovebankData via loadCustomLiveQuery
   */
  it('should trigger getCustomMovebankData when loadCustomLiveQuery is called', async () => {
    component.queryForm.setValue({
      entityType: 'taxon',
      studyId: '12345',
    });

    component.loadCustomLiveQuery();
    await fixture.whenStable();

    expect(component.activeSource()).toBe('live');
    expect(datasetServiceMock.getCustomMovebankData).toHaveBeenCalledWith('taxon', '12345');
    expect(component.datasets()).toEqual(mockDatasets);
  });
});
