import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { FollowTeamRequest, FollowTeamResponse } from '@sneat/extension-team-contract';

// Minimal team service contract. Expand as sneat.team is specified.
export interface ITeamService {
  follow(request: FollowTeamRequest): Observable<FollowTeamResponse>;
}

export const TEAM_SERVICE = new InjectionToken<ITeamService>('TeamService');
