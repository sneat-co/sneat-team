import { TEAM_SERVICE } from './team-service';
import { TeamService } from './services';
import { provideTeamInternal } from './provide-team-internal';

describe('provideTeamInternal', () => {
  it('provides TeamService and binds it to TEAM_SERVICE', () => {
    const providers = provideTeamInternal();
    expect(providers).toContain(TeamService);
    expect(providers).toContainEqual({
      provide: TEAM_SERVICE,
      useExisting: TeamService,
    });
  });
});
