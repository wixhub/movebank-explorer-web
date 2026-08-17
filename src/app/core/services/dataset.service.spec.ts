import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { DatasetService } from './dataset.service';

describe('DatasetService', () => {
  let service: DatasetService;
  let httpMock: HttpTestingController;

  const WORKER_BASE_URL = 'https://wispy-surf-c9db.rublin.workers.dev';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DatasetService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(DatasetService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    // Verify that no unmatched requests are outstanding
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch local datasets successfully', () => {
    let result: any[] = [];

    service.getLocalDatasets().subscribe((data) => {
      result = data;
    });

    const req = httpMock.expectOne('data/datasets.json');
    expect(req.request.method).toBe('GET');

    const mockData = [{ id: 'local-1', title: 'Local Study' }];
    req.flush(mockData);

    expect(result.length).toBe(1);
    expect(result[0].title).toBe('Local Study');
  });

  it('should parse CSV response correctly and map it into Dataset[] via getCustomMovebankData', () => {
    let result: any[] = [];

    service.getCustomMovebankData('study', '12345').subscribe((datasets) => {
      result = datasets;
    });

    // Expect the HTTP request triggered by getCustomMovebankData
    const req = httpMock.expectOne((request) => request.url.includes(WORKER_BASE_URL));

    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('entity_type')).toBe('study');
    expect(req.request.params.get('study_id')).toBe('12345');
    expect(req.request.params.get('i_can_see_data')).toBe('true');

    // Mock a CSV response payload from the worker proxy
    const mockCsvResponse =
      'id,name,description,principal_investigator_name,license_type\n' +
      '1,Test Study,A test description,John Doe,CC0';

    req.flush(mockCsvResponse);

    // Verify that data was successfully parsed and mapped
    expect(result.length).toBe(1);
    expect(result[0].id).toBe('custom-1');
    expect(result[0].title).toBe('Test Study');
    expect(result[0].abstract).toBe('A test description');
    expect(result[0].authors).toEqual(['John Doe']);
    expect(result[0].license).toBe('CC0');
  });

  it('should handle empty or invalid text responses gracefully', () => {
    let result: any[] = [];

    service.getCustomMovebankData('study').subscribe((datasets) => {
      result = datasets;
    });

    const req = httpMock.expectOne((request) => request.url.includes(WORKER_BASE_URL));

    // Return a response containing only headers without rows
    req.flush('id,name\n');

    expect(result).toEqual([]);
  });
});
