import { NgModule } from '@angular/core';
import {
  ITeamAppStateService,
  TeamAppStateService,
} from './team-app-state.service';

// Provides the template UI-state service. The concrete ListService is no longer
// provided here — it is bound to the TEAM_SERVICE contract token by
// provideTeamInternal() at app bootstrap (the app is the composition root).
@NgModule({
  providers: [
    {
      provide: ITeamAppStateService,
      useClass: TeamAppStateService,
    },
  ],
})
export class TeamCoreServicesModule {}
