import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DatasetCatalog } from './dataset-catalog';

describe('DatasetCatalog', () => {
  let component: DatasetCatalog;
  let fixture: ComponentFixture<DatasetCatalog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DatasetCatalog],
    }).compileComponents();

    fixture = TestBed.createComponent(DatasetCatalog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
