import { TEAM_SERVICE } from '@sneat/extension-team-contract';
import { ListService } from './services';
import { provideTeamInternal } from './provide-team-internal';

describe('provideTeamInternal', () => {
  it('provides ListService and binds it to TEAM_SERVICE', () => {
    const providers = provideTeamInternal();
    expect(providers).toContain(ListService);
    expect(providers).toContainEqual({
      provide: TEAM_SERVICE,
      useExisting: ListService,
    });
  });
});
