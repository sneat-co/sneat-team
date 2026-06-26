import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { FollowTeamRequest, FollowTeamResponse } from '@sneat/extension-team-contract';
import { ITeamService } from '../team-service';

@Injectable()
export class TeamService implements ITeamService {
  follow(_request: FollowTeamRequest): Observable<FollowTeamResponse> {
    return throwError(() => new Error('not implemented'));
  }
}
