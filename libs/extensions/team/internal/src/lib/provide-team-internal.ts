import { Provider } from '@angular/core';
import { TEAM_SERVICE } from '@sneat/extension-team-contract';
import { ListService } from './services';

// Registers the concrete ListService and binds it to the TEAM_SERVICE token so
// consumers depend only on the ITeamService contract. Wired in at app bootstrap
// (consumers do not import this factory directly).
export function provideTeamInternal(): Provider[] {
  return [ListService, { provide: TEAM_SERVICE, useExisting: ListService }];
}
