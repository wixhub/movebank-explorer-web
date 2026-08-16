import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, map, catchError } from 'rxjs';
import { Dataset } from '../models/dataset.model';

@Injectable({
  providedIn: 'root',
})
export class DatasetService {
  private readonly http = inject(HttpClient);

  // Cloudflare Worker URL acting as a secure proxy to Movebank
  private readonly workerBaseUrl = 'https://wispy-surf-c9db.rublin.workers.dev';

  /**
   * Fetches local static mock datasets (fallback or offline demo mode)
   */
  getLocalDatasets(): Observable<Dataset[]> {
    return this.http.get<Dataset[]>('data/datasets.json').pipe(
      catchError((error: unknown) => {
        console.error('Failed to load local datasets', error);
        return of([]);
      }),
    );
  }

  /**
   * Universal method that fetches data based on user-selected parameters
   */
  getCustomMovebankData(entityType: string, studyId?: string): Observable<Dataset[]> {
    let params = new HttpParams().set('entity_type', entityType).set('i_can_see_data', 'true');

    if (studyId?.trim()) {
      params = params.set('study_id', studyId.trim());
    }

    return this.http.get(this.workerBaseUrl, { params, responseType: 'text' }).pipe(
      map((responseText: string) => {
        if (!responseText) return [];

        const lines = responseText.split('\n').filter((line) => line.trim().length > 0);
        if (lines.length < 2) return [];

        const delimiter = lines[0].includes('\t') ? '\t' : ',';
        const headers = lines[0].split(delimiter).map((h) => h.replace(/["']/g, '').trim());

        const items: Record<string, string>[] = [];
        for (let i = 1; i < lines.length; i++) {
          const currentLine = lines[i].split(delimiter);
          if (currentLine.length === headers.length) {
            const obj: Record<string, string> = {};
            for (let j = 0; j < headers.length; j++) {
              obj[headers[j]] = currentLine[j].replace(/["']/g, '').trim();
            }
            items.push(obj);
          }
        }

        return items.slice(0, 20).map((item, index) => ({
          id: `custom-${item['id'] || index}`,
          title: item['name'] || item['local_identifier'] || `Query Result [${entityType}]`,
          doi: item['doi'] || (studyId ? `Study ID: ${studyId}` : 'Movebank Registry'),
          abstract: item['description'] || `Dynamic record fetched via entity type: ${entityType}`,
          authors: [item['principal_investigator_name'] || item['taxon'] || 'Movebank User'],
          discipline: 'Wildlife Telemetry',
          format: `API Query (${entityType})`,
          fileSize: 'Live Stream',
          publicationDate: new Date().toISOString().split('T')[0],
          license: item['license_type'] || 'CC0',
          tags: [entityType, 'Movebank API', 'Dynamic Filter'],
          downloadsCount: Math.floor(Math.random() * 1000) + 100,
        }));
      }),
      catchError((error: unknown) => {
        console.error('Custom query failed', error);
        return of([]);
      }),
    );
  }

  /**
   * Helper method to map raw upstream study items to the internal application Dataset model
   */
  private mapToDatasets(studies: Record<string, any>[], formatName: string): Dataset[] {
    return studies.slice(0, 15).map((study, index) => ({
      id: `mb-${study['id'] || study['study_id'] || index}`,
      title: study['name'] || study['title'] || 'Untitled Movebank Study',
      doi:
        study['doi'] && study['doi'] !== ''
          ? study['doi']
          : 'N/A (Movebank ID: ' + (study['id'] || study['study_id']) + ')',
      abstract:
        study['description'] ||
        study['study_objective'] ||
        'Live data synchronized via secure Cloudflare Worker proxy.',
      authors: [study['principal_investigator_name'] || 'Movebank Researcher'],
      discipline: 'Animal Telemetry & Behaviour',
      format: formatName,
      fileSize: 'Dynamic Live Stream',
      publicationDate:
        study['timestamp'] || study['go_public_date'] || new Date().toISOString().split('T')[0],
      license: study['license_type'] || 'CC0',
      tags: ['Live API', 'Movebank', 'Telemetry'],
      downloadsCount: Math.floor(Math.random() * 2000) + 100,
    }));
  }
}
