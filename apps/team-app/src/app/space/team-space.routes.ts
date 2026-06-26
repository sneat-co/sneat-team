import { Route } from '@angular/router';
import {
  templateRoutes,
  TeamSpaceMenuComponent,
} from '@sneat/extension-team-shared';
import { SpaceComponentBaseParams } from '@sneat/space-components';

// Thin, team-only space shell. It provides SpaceComponentBaseParams (which
// resolves the active space from the :spaceType/:spaceID route params) to all
// children, then mounts ONLY the template routes — unlike sneat-app's
// @sneat/space-pages, which bundles every extension. This keeps template.app
// decoupled while reusing the published @sneat/space-components context wiring.
export const templateSpaceRoutes: Route[] = [
  {
    path: '',
    providers: [SpaceComponentBaseParams],
    children: [
      {
        // team-specific side menu (space selector + the space's lists) instead
        // of the generic SpaceMenuComponent, which hardcodes every sneat-app
        // extension (Assets, Budget, Contacts, …) — none of which exist here.
        path: '',
        component: TeamSpaceMenuComponent,
        outlet: 'menu',
      },
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'lists',
      },
      ...templateRoutes,
    ],
  },
];
