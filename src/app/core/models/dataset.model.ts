export interface Dataset {
  id: string;
  title: string;
  doi: string;
  abstract: string;
  authors: string[];
  discipline: string;
  format: string;
  fileSize: string;
  publicationDate: string;
  license: string;
  tags: string[];
  downloadsCount: number;
}
