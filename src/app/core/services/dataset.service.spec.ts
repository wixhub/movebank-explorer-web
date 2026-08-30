import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
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
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch local datasets successfully', () => {
    const mockDatasets = [{ id: '1', title: 'Local Dataset' }];

    service.getLocalDatasets().subscribe((datasets) => {
      expect(datasets).toEqual(mockDatasets);
    });

    const req = httpMock.expectOne('data/datasets.json');
    expect(req.request.method).toBe('GET');
    req.flush(mockDatasets);
  });

  it('should fallback to empty array on local datasets error', () => {
    service.getLocalDatasets().subscribe((datasets) => {
      expect(datasets).toEqual([]);
    });

    const req = httpMock.expectOne('data/datasets.json');
    req.error(new ProgressEvent('error'));
  });

  it('should parse CSV response rows correctly in custom movebank data', () => {
    const csvResponse = 'id,name,taxon\n' + '101,White Stork,Ciconia ciconia\n';

    service.getCustomMovebankData('event', '123').subscribe((datasets) => {
      expect(datasets.length).toBe(1);
      expect(datasets[0].title).toBe('White Stork');
      expect(datasets[0].id).toBe('custom-101');
    });

    const req = httpMock.expectOne(
      (request) =>
        request.url === 'https://wispy-surf-c9db.rublin.workers.dev' &&
        request.params.get('entity_type') === 'event' &&
        request.params.get('study_id') === '123' &&
        request.params.get('i_can_see_data') === 'true',
    );

    expect(req.request.method).toBe('GET');
    req.flush(csvResponse);
  });

  it('should apply taxon mapping automatically if taxon name is provided without study id', () => {
    const csvResponse = 'id,name,taxon\n' + '202,Stork Flight,Ciconia ciconia\n';

    service
      .getCustomMovebankData('study', undefined, { taxon_canonical_name: 'Ciconia ciconia' })
      .subscribe((datasets) => {
        expect(datasets.length).toBe(1);
        expect(datasets[0].title).toBe('Stork Flight');
      });

    const req = httpMock.expectOne(
      (request) =>
        request.url === 'https://wispy-surf-c9db.rublin.workers.dev' &&
        request.params.get('study_id') === '2911276' &&
        request.params.get('entity_type') === 'event' &&
        request.params.get('sensor_type_id') === '653',
    );

    req.flush(csvResponse);
  });

  it('should return error notice dataset item when custom query fails', () => {
    service.getCustomMovebankData('study', '999').subscribe((datasets) => {
      expect(datasets.length).toBe(1);
      expect(datasets[0].id).toBe('error-notice');
      expect(datasets[0].title).toBe('Movebank Access Restriction Notice');
    });

    const req = httpMock.expectOne((request) =>
      request.url.includes('wispy-surf-c9db.rublin.workers.dev'),
    );
    req.error(new ProgressEvent('error'), { status: 403, statusText: 'Forbidden' });
  });

  it('should send natural language prompt to AI assistant endpoint', () => {
    const mockAiResponse = {
      entity_type: 'event',
      filters: { taxon_canonical_name: 'Ciconia ciconia' },
    };

    service.askAiAssistant('Show me storks').subscribe((res) => {
      expect(res).toEqual(mockAiResponse);
    });

    const req = httpMock.expectOne('https://wispy-surf-c9db.rublin.workers.dev/api/ai-query');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ prompt: 'Show me storks' });
    req.flush(mockAiResponse);
  });
});
