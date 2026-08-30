import { Service, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, map, catchError } from 'rxjs';
import { Dataset } from '../models/dataset.model';

@Service()
export class DatasetService {
  private readonly http = inject(HttpClient);

  // Cloudflare Worker URL acting as a secure proxy to Movebank
  private readonly workerBaseUrl = 'https://wispy-surf-c9db.rublin.workers.dev';

  private readonly aiQueryUrl = 'https://wispy-surf-c9db.rublin.workers.dev/api/ai-query';

  // Map of known species to study ID, entity type and required sensor type
  private readonly taxonStudyMap: Record<
    string,
    { studyId: string; entityType: string; sensorTypeId: string }
  > = {
    'Ciconia ciconia': { studyId: '2911276', entityType: 'event', sensorTypeId: '653' },
  };

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
   * Safely parses a CSV/TSV line while respecting quoted values containing delimiters.
   */
  private parseCsvLine(line: string, sep: string): string[] {
    const result: string[] = [];
    let inQuotes = false;
    let entry = '';
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"' || char === "'") {
        inQuotes = !inQuotes;
      } else if (char === sep && !inQuotes) {
        result.push(entry.trim().replace(/^["']|["']$/g, ''));
        entry = '';
      } else {
        entry += char;
      }
    }
    result.push(entry.trim().replace(/^["']|["']$/g, ''));
    return result;
  }

  /**
   * Universal method that fetches data based on user-selected parameters.
   */
  getCustomMovebankData(
    entityType: string,
    studyId?: string,
    filters?: Record<string, string>,
  ): Observable<Dataset[]> {
    let resolvedStudyId = studyId?.trim();
    let resolvedEntity =
      entityType.toLowerCase() === 'studies' ? 'study' : entityType.toLowerCase();
    let resolvedSensorType = filters?.['sensor_type_id'];
    const taxonName = filters?.['taxon_canonical_name'];

    if (!resolvedStudyId && taxonName && this.taxonStudyMap[taxonName]) {
      resolvedStudyId = this.taxonStudyMap[taxonName].studyId;
      resolvedEntity = this.taxonStudyMap[taxonName].entityType;
      resolvedSensorType = this.taxonStudyMap[taxonName].sensorTypeId;
    }

    let params = new HttpParams().set('entity_type', resolvedEntity).set('i_can_see_data', 'true');

    if (resolvedStudyId) {
      params = params.set('study_id', resolvedStudyId);
    }

    if (resolvedSensorType) {
      params = params.set('sensor_type_id', resolvedSensorType);
    }

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value && key !== 'sensor_type_id' && key !== 'taxon_canonical_name') {
          params = params.set(key, value);
        }
      });
    }

    // Remaining request implementation...
    return this.http.get(this.workerBaseUrl, { params, responseType: 'text' }).pipe(
      map((responseText: string) => {
        if (!responseText || responseText.trim().length === 0) {
          throw new Error('Empty response received from server.');
        }

        // Intercept JSON error payloads returned by the Cloudflare Worker proxy
        const trimmed = responseText.trim();
        if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
          try {
            const json = JSON.parse(trimmed);
            if (json.error) {
              throw new Error(json.details || json.error);
            }
          } catch (e) {
            if (e instanceof Error && e.message !== 'Unexpected token') {
              throw e;
            }
          }
        }

        const lines = responseText.split('\n').filter((line) => line.trim().length > 0);
        if (lines.length === 0) return [];

        const delimiter = lines[0].includes('\t') ? '\t' : ',';
        const headers = this.parseCsvLine(lines[0], delimiter);

        // Handle header-only responses (metadata schema definitions)
        if (lines.length < 2) {
          return [
            {
              id: `schema-${resolvedEntity}`,
              title: `Movebank Schema: ${resolvedEntity.toUpperCase()}`,
              doi: resolvedStudyId ? `Study ID: ${resolvedStudyId}` : 'Movebank Direct-Read',
              abstract: `Endpoint returned structural schema with ${headers.length} attributes. Specific entity records were not found or require authorization permissions.`,
              authors: ['Movebank API Schema'],
              discipline: 'Wildlife Telemetry',
              format: `API Metadata (${resolvedEntity})`,
              fileSize: 'Schema Definition',
              publicationDate: new Date().toISOString().split('T')[0],
              license: 'CC0',
              tags: [resolvedEntity, 'Metadata Schema', 'Movebank'],
              downloadsCount: 1,
            },
          ];
        }

        // Parse CSV/TSV data rows safely using the quote-aware parser
        const items = lines.slice(1).reduce((acc: Record<string, string>[], currentLineStr) => {
          const currentLine = this.parseCsvLine(currentLineStr, delimiter);
          if (currentLine.length >= Math.floor(headers.length / 2)) {
            const obj = headers.reduce((rowObj: Record<string, string>, header, j) => {
              rowObj[header] = currentLine[j] ?? '';
              return rowObj;
            }, {});
            acc.push(obj);
          }
          return acc;
        }, []);

        return items.slice(0, 20).map((item, index) => {
          const title =
            item['name'] ??
            item['local_identifier'] ??
            item['taxon'] ??
            `${resolvedEntity.toUpperCase()} Record #${index + 1}`;

          const abstract =
            item['study_objective'] ??
            item['comments'] ??
            (item['location_lat']
              ? `Lat: ${item['location_lat']}, Long: ${item['location_long']} | Timestamp: ${item['timestamp'] ?? 'N/A'}`
              : `Telemetry record retrieved from ${resolvedEntity} endpoint.`);

          return {
            id: `custom-${item['id'] ?? index}`,
            title,
            doi:
              item['doi'] ??
              (resolvedStudyId ? `Study ID: ${resolvedStudyId}` : 'Movebank Registry'),
            abstract,
            authors: [
              item['principal_investigator_name'] ??
                item['ring_id'] ??
                item['taxon'] ??
                'Movebank Researcher',
            ],
            discipline: 'Wildlife Telemetry',
            format: `API Record (${resolvedEntity})`,
            fileSize: 'Live Data',
            publicationDate: new Date().toISOString().split('T')[0],
            license: item['license_type'] ?? 'CC0',
            tags: [resolvedEntity, item['taxon'] ?? 'Telemetry', 'Live Data'].filter(Boolean),
            downloadsCount: Math.floor(Math.random() * 800) + 200,
          };
        });
      }),
      catchError((error: unknown) => {
        console.error('Custom query failed', error);
        const errorMsg =
          error instanceof Error ? error.message : 'Failed to fetch live data from Movebank.';

        // Fallback dataset card displaying a clean error state without crashing the UI
        return of([
          {
            id: 'error-notice',
            title: 'Movebank Access Restriction Notice',
            doi: resolvedStudyId ? `Study ID: ${resolvedStudyId}` : 'Direct-Read Endpoint',
            abstract: `${errorMsg} This study may require explicit license agreement acceptance or a registered Movebank account login to stream raw telemetry rows. Try switching the Entity dropdown to 'Studies (List)' to view catalog metadata instead.`,
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
  }

  /**
   * Sends natural language prompt to the Cloudflare AI worker proxy
   */
  askAiAssistant(
    prompt: string,
  ): Observable<{ entity_type: string; filters: Record<string, string> }> {
    return this.http.post<{ entity_type: string; filters: Record<string, string> }>(
      this.aiQueryUrl,
      { prompt },
    );
  }
}
