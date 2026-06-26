import { Injectable, inject } from '@angular/core';
import {
  IListBrief,
  IListDbo,
  ITeamService,
  TEAM_SERVICE,
} from '@sneat/extension-team-contract';
import { SpaceComponentBaseParams } from '@sneat/space-components';
import { ModuleSpaceItemService } from '@sneat/space-services';

// The template service obtained via the contract token. BaseListPage passes it to
// the SpaceItemPageBaseComponent super constructor, which expects a concrete
// ModuleSpaceItemService<IListBrief, IListDbo>; the bound implementation extends
// exactly that, so the injected value is typed as the intersection.
export type TeamServiceWithSpaceItem = ITeamService &
  ModuleSpaceItemService<IListBrief, IListDbo>;

@Injectable()
export class TeamComponentBaseParams {
  readonly spaceParams = inject(SpaceComponentBaseParams);
  readonly listService = inject<TeamServiceWithSpaceItem>(TEAM_SERVICE);
}
