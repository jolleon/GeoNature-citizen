import { Injectable, Optional, SkipSelf, OnInit } from "@angular/core";
import {
  DomSanitizer,
  TransferState,
  makeStateKey
} from "@angular/platform-browser";
import { HttpClient } from "@angular/common/http";
import { Observable, of, Subject } from "rxjs";
import {
  catchError,
  map,
  mergeMap,
  take,
  share,
  pluck,
  tap
} from "rxjs/operators";

import { FeatureCollection, Feature } from "geojson";

import { AppConfig } from "../../conf/app.config";
import { Program } from "../programs/programs.models";
import { TaxonomyList } from "../programs/observations/observation.model";

const PROGRAMS_KEY = makeStateKey("programs");

export interface IGncProgram extends Feature {
  properties: Program;
}

export interface IGncFeatures extends FeatureCollection {
  features: IGncProgram[];
  count: number;
}

const sorted = (property: string) => {
  if (!property) return undefined;
  let sortOrder = 1;

  if (property[0] === "-") {
    sortOrder = -1;
    property = property.substr(1);
  }

  return (a, b) => {
    return sortOrder === -1
      ? b[property].localeCompare(a[property])
      : a[property].localeCompare(b[property]);
  };
};

@Injectable({
  deps: [
    [new Optional(), new SkipSelf(), GncProgramsService],
    HttpClient,
    TransferState,
    DomSanitizer
  ],
  providedIn: "root",
  useFactory: (
    instance: GncProgramsService | null,
    http: HttpClient,
    state: TransferState,
    domSanitizer: DomSanitizer
  ) => instance || new GncProgramsService(http, state, domSanitizer)
})
export class GncProgramsService implements OnInit {
  private readonly URL = AppConfig.API_ENDPOINT;
  programs: Program[];
  programs$ = new Subject<Program[]>();

  constructor(
    protected http: HttpClient,
    private state: TransferState,
    protected domSanitizer: DomSanitizer
  ) {}

  ngOnInit() {
    this.programs = this.state.get(PROGRAMS_KEY, null as Program[]);
    this.programs$.next(this.programs);
  }

  getAllPrograms(): Observable<Program[]> {
    // console.debug(`
    //   stateKey: ${this.state.hasKey(PROGRAMS_KEY)},
    //   state: ${this.state.get(PROGRAMS_KEY, null as Program[]) != null}
    //   programs: ${this.programs != null}`);

    if (!this.programs) {
      // console.warn("getAllPrograms");

      return this.http.get<IGncFeatures>(`${this.URL}/programs`).pipe(
        pluck("features"),
        map((features: IGncProgram[]) =>
          features.map(feature => feature.properties)
        ),
        map((programs: Program[]) =>
          programs.map(program => {
            program.html_short_desc = this.domSanitizer.bypassSecurityTrustHtml(
              program.short_desc
            );
            program.html_long_desc = this.domSanitizer.bypassSecurityTrustHtml(
              program.long_desc
            );
            return program;
          })
        ),
        map(programs => programs.sort(sorted(AppConfig["program_list_sort"]))),
        tap(programs => {
          this.state.set(PROGRAMS_KEY, programs as Program[]);
          this.programs$.next(programs);
        }),
        catchError(this.handleError<Program[]>("getAllPrograms"))
      );
    } else {
      // console.debug("I want this!");
      return this.programs$;
    }
  }

  getProgram(id: number): Observable<FeatureCollection> {
    return this.http
      .get<FeatureCollection>(`${this.URL}/programs/${id}`)
      .pipe(
        catchError(this.handleError<FeatureCollection>(`getProgram id=${id}`))
      );
  }

  getProgramObservations(id: number): Observable<FeatureCollection> {
    return this.http
      .get<FeatureCollection>(`${this.URL}/programs/${id}/observations`)
      .pipe(
        catchError(
          this.handleError<FeatureCollection>(`getProgramObservations id=${id}`)
        )
      );
  }

  getProgramSites(id: number): Observable<FeatureCollection> {
    return this.http
      .get<FeatureCollection>(`${this.URL}/sites/programs/${id}`)
      .pipe(
        take(1),
        catchError(
          this.handleError<FeatureCollection>(`getProgramObservations id=${id}`)
        )
      );
  }

  getSiteDetails(id: number): Observable<FeatureCollection> {
    return this.http
      .get<FeatureCollection>(`${this.URL}/sites/${id}`)
      .pipe(
        take(1),
        catchError(
          this.handleError<FeatureCollection>(`getProgramObservations id=${id}`)
        )
      );
  }

  getProgramTaxonomyList(program_id: number): Observable<TaxonomyList> {
    return this.getAllPrograms().pipe(
      map(programs => programs.find(p => p.id_program == program_id)),
      mergeMap(program =>
        this.http.get<TaxonomyList>(
          `${this.URL}/taxonomy/lists/${program["taxonomy_list"]}/species`
        )
      ),
      catchError(this.handleError<TaxonomyList>(`getProgramTaxonomyList`))
    );
  }

  private handleError<T>(operation = "operation", result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed: ${error.message}`, error);
      return of(result as T);
    };
  }

  // public createProgram(program: Program): Observable<Program> {
  //   return this.http
  //     .post<Program>(`${this.URL}/programs`, program)
  //     .map(response => response.json() || []);
  // }

  // public updateProgram(program: Program): Observable<Program> {
  // return this.http
  //   .put<Program>(`${this.URL}/programs/${program.id_program}`, program)
  //   .map(response => response.json() || []);
  // }

  // public deleteProgram(program: Program): Observable<Program> {
  //   return this.http
  //     .delete<Program>(`${this.URL}/programs/${program.id_program}`)
  //     .map(response => response.json() || []);
  // }
}
