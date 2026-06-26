import { Provider } from '@angular/core';
import { TEAM_SERVICE } from './team-service';
import { TeamService } from './services';

// Registers the concrete TeamService and binds it to the TEAM_SERVICE token so
// consumers depend only on the ITeamService contract. Wired in at app bootstrap
// (consumers do not import this factory directly).
export function provideTeamInternal(): Provider[] {
  return [TeamService, { provide: TEAM_SERVICE, useExisting: TeamService }];
}
