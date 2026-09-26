/**
 * Bridges the ES-module world (Supabase client + services, which need
 * `import`/`export` and therefore must be modules) into the classic-script
 * world (src/main.js, which must stay a non-module script so its top-level
 * `function foo(){}` declarations attach to `window` — required for the
 * `onclick="foo()"` handlers rendered throughout the UI).
 *
 * Loading order in index.html:
 *   <script type="module" src="/src/app-init.js"></script>
 *   <script src="/src/main.js"></script>
 *
 * This works regardless of which tag comes first in the HTML, because
 * `type="module"` scripts are always deferred until after the document has
 * parsed, and `DOMContentLoaded` doesn't fire until *all* deferred/module
 * scripts have finished running — main.js only touches
 * `window.CareConnect*` inside its `DOMContentLoaded` handler (see
 * bootApp() in main.js), never at its own top level, so by the time it
 * needs any of this, it's already here.
 */
import { IS_SUPABASE_CONFIGURED } from './config.js';
import { supabase } from './supabase/client.js';
import * as authService from './services/auth.js';
import * as profilesService from './services/profiles.js';
import * as medicinesService from './services/medicines.js';
import * as appointmentsService from './services/appointments.js';
import * as postDischargeService from './services/postDischarge.js';
import * as recordsService from './services/records.js';
import * as healthcareService from './services/healthcare.js';
import * as consultationsService from './services/consultations.js';
import * as caregiversService from './services/caregivers.js';
import * as notificationsService from './services/notifications.js';
import * as emergencyContactsService from './services/emergencyContacts.js';

window.BACKEND_MODE = IS_SUPABASE_CONFIGURED ? 'supabase' : 'local';
window.supabaseClient = supabase;
window.CareConnectServices = {
  auth: authService,
  profiles: profilesService,
  medicines: medicinesService,
  appointments: appointmentsService,
  postDischarge: postDischargeService,
  records: recordsService,
  healthcare: healthcareService,
  consultations: consultationsService,
  caregivers: caregiversService,
  notifications: notificationsService,
  emergencyContacts: emergencyContactsService,
};

if (!IS_SUPABASE_CONFIGURED) {
  console.info(
    '[CareConnect] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY not set — running in local demo mode (data stored in this browser only). See README.md → "Local demo mode vs. Supabase mode".'
  );
}
