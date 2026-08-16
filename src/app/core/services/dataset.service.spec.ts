import { TestBed } from '@angular/core/testing';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { DatasetService } from './dataset.service';

describe('DatasetService', () => {
  let service: DatasetService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DatasetService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(DatasetService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    // Ensure that there are no outstanding HTTP requests
    httpMock.verify();
  });

  /**
   * Test case to verify that the service is successfully created
   */
  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  /**
   * Test case for fetching local static mock datasets successfully
   */
  it('should fetch local datasets successfully', async () => {
    const mockDatasets = [
      {
        id: '1',
        title: 'Test Dataset',
        doi: '10.1234/test',
        abstract: 'Test abstract',
        authors: ['John Doe'],
        discipline: 'Biology',
        format: 'JSON',
        fileSize: '1MB',
        publicationDate: '2026-01-01',
        license: 'CC0',
        tags: ['Test'],
        downloadsCount: 10,
      },
    ];

    const datasetsPromise = firstValueFrom(service.getLocalDatasets());

    const req = httpMock.expectOne('data/datasets.json');
    expect(req.request.method).toBe('GET');
    req.flush(mockDatasets);

    const datasets = await datasetsPromise;
    expect(datasets).toEqual(mockDatasets);
  });

  /**
   * Test case for handling errors when fetching local datasets (should return empty array)
   */
  it('should handle error when fetching local datasets fails', async () => {
    const datasetsPromise = firstValueFrom(service.getLocalDatasets());

    const req = httpMock.expectOne('data/datasets.json');
    req.error(new ProgressEvent('error'), { status: 404, statusText: 'Not Found' });

    const datasets = await datasetsPromise;
    expect(datasets).toEqual([]);
  });

  /**
   * Test case for custom movebank data parsing (CSV/TSV response handling)
   */
  it('should fetch and parse custom movebank text data correctly', async () => {
    const mockCsvResponse =
      'id\tname\tdescription\tprincipal_investigator_name\n' +
      '101\tEagle Migration\tTracking eagles in winter\tDr. Smith';

    const datasetsPromise = firstValueFrom(service.getCustomMovebankData('studies', '12345'));

    const req = httpMock.expectOne((request) => request.url === (service as any).workerBaseUrl);

    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('entity_type')).toBe('studies');
    expect(req.request.params.get('study_id')).toBe('12345');

    req.flush(mockCsvResponse, { headers: { 'Content-Type': 'text/plain' } });

    const datasets = await datasetsPromise;
    expect(datasets.length).toBe(1);
    expect(datasets[0].title).toBe('Eagle Migration');
    expect(datasets[0].doi).toContain('Study ID: 12345');
  });

  /**
   * Test case for handling errors during custom movebank queries
   */
  it('should handle errors gracefully during custom movebank queries', async () => {
    const datasetsPromise = firstValueFrom(service.getCustomMovebankData('studies'));

    const req = httpMock.expectOne((request) => request.url === (service as any).workerBaseUrl);
    req.error(new ProgressEvent('error'), { status: 500, statusText: 'Server Error' });

    const datasets = await datasetsPromise;
    expect(datasets).toEqual([]);
  });
});
