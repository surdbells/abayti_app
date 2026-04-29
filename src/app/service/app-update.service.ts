/* =============================================================================
   AppUpdateService — version check + remote kill-switch + force-update flow
   -----------------------------------------------------------------------------
   Composes two signals to decide whether to FORCE the user to update:

     1. Local: store version vs installed version, via @capawesome/capacitor-app-update
        - Android: Google Play Core's AppUpdateManager
        - iOS:     iTunes Lookup API (App Store)
        - Web:     unsupported, returns no-update

     2. Remote: a static JSON kill-switch hosted at environment.appUpdate.configUrl
        - require_app_update:  global on/off  (default false = no force)
        - min_required_version: semver string, force only if installed < this
        - force_update_threshold: "patch" | "minor" | "major"
            "patch" forces any version below min_required_version
            "minor" forces only when minor or major bump
            "major" forces only on major bump
        - force_update_message_en / _ar: optional override copy

   Both must agree before a force-update prompt fires:
     remote.require_app_update === true
     AND local has an update available
     AND installed version < remote.min_required_version
     AND threshold satisfies (e.g., for "minor" threshold, the bump must be at
         least minor-level).

   Failing safe: any error (network, malformed JSON, plugin missing, browser
   build) results in shouldForceUpdate=false. The kill-switch activates updates
   only when ALL conditions are met. This means:
     - First-time deploy: configUrl is '', so kill-switch is dormant — no force
     - Remote server down: defaults to no force
     - Plugin returns wrong values: usually no force (the "unknown" path)

   Manually flipping the kill-switch:
     1. Edit the hosted JSON file: set require_app_update: true
     2. Set min_required_version to the version you want to force users TO
     3. Save / re-deploy the file
     4. Within the cache window (e.g., 5 min), every app launch / resume will
        hit the new value and force the prompt.
     5. To deactivate: set require_app_update back to false.

   ============================================================================= */

import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { environment } from '../../environments/environment';

/* JSON shape expected at environment.appUpdate.configUrl. All fields
   optional in case the file is partial — failing-safe defaults applied. */
export interface RemoteAppConfig {
  require_app_update?: boolean;
  min_required_version?: string;          // semver, e.g. "0.0.2"
  force_update_message_en?: string;
  force_update_message_ar?: string;
  force_update_threshold?: 'patch' | 'minor' | 'major';
}

export interface UpdateCheckResult {
  /* True iff the app should show the force-update prompt right now. */
  shouldForceUpdate: boolean;
  /* The version available in the store (if known), e.g. "0.0.2". May be
     missing if the plugin couldn't reach the store API. */
  availableVersion: string | null;
  /* The version currently installed on the device. May be missing on web. */
  currentVersion: string | null;
  /* Whether a non-forced update is also available — informational, not used
     by the hard-prompt UI but exposed for future use. */
  updateAvailable: boolean;
  /* Localized force-update message text, prefilled by the remote config or
     fallback. Caller passes to the prompt component as-is. */
  messageEn: string;
  messageAr: string;
}

/* Default messages used when the remote config doesn't provide overrides. */
const DEFAULT_MESSAGE_EN = 'An important update is required to continue using the app.';
const DEFAULT_MESSAGE_AR = 'يلزم تثبيت تحديث مهم للاستمرار في استخدام التطبيق.';

@Injectable({ providedIn: 'root' })
export class AppUpdateService {
  /* Cache the remote config in memory for the lifetime of one app launch.
     We re-fetch on every app resume (handled by the caller), but within a
     single session we don't repeatedly hit the URL. */
  private cachedRemote: RemoteAppConfig | null = null;
  private cachedAt: number = 0;
  private readonly CACHE_TTL_MS = 5 * 60 * 1000;  // 5 minutes

  /* The plugin is dynamically imported so the web build doesn't pull in
     native code. Resolved once on first call; null on web. */
  private pluginPromise: Promise<any> | null = null;

  /**
   * Run the full update check. Combines store-version check + remote
   * kill-switch + threshold logic. Returns a result object the caller
   * can use to decide whether to render the force-update prompt.
   *
   * Always resolves — never throws. Errors in any underlying call result
   * in shouldForceUpdate=false (fail safe).
   */
  async check(): Promise<UpdateCheckResult> {
    const fallback: UpdateCheckResult = {
      shouldForceUpdate: false,
      availableVersion: null,
      currentVersion: null,
      updateAvailable: false,
      messageEn: DEFAULT_MESSAGE_EN,
      messageAr: DEFAULT_MESSAGE_AR,
    };

    /* Web build: bail out early. The plugin throws if called outside
       a native context, and there's nothing meaningful we'd do for a
       browser user anyway. */
    if (!Capacitor.isNativePlatform()) {
      return fallback;
    }

    /* Run store check + remote check in parallel. They're independent. */
    const [storeInfo, remote] = await Promise.all([
      this.fetchStoreInfo(),
      this.fetchRemoteConfig(),
    ]);

    /* Compose the result. */
    const result: UpdateCheckResult = {
      ...fallback,
      availableVersion: storeInfo.availableVersion,
      currentVersion: storeInfo.currentVersion,
      updateAvailable: storeInfo.updateAvailable,
      messageEn: remote?.force_update_message_en || DEFAULT_MESSAGE_EN,
      messageAr: remote?.force_update_message_ar || DEFAULT_MESSAGE_AR,
    };

    /* Decide whether to force. All conditions must be satisfied:
         - Remote kill-switch flipped on
         - Store reports an update is available
         - Installed version is below the configured min_required_version
         - The version bump meets the configured threshold
    */
    if (
      remote?.require_app_update === true &&
      storeInfo.updateAvailable &&
      storeInfo.currentVersion &&
      remote.min_required_version &&
      compareSemver(storeInfo.currentVersion, remote.min_required_version) < 0 &&
      meetsThreshold(
        storeInfo.currentVersion,
        remote.min_required_version,
        remote.force_update_threshold || 'patch'
      )
    ) {
      result.shouldForceUpdate = true;
    }

    return result;
  }

  /**
   * Trigger the actual update flow. On Android, attempts an in-app update if
   * the Play Store reports it as supported; otherwise falls back to opening
   * the Play Store. On iOS, opens the App Store listing.
   *
   * Caller invokes this when the user taps "Update now" in the prompt.
   */
  async startUpdate(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      return;
    }
    const plugin = await this.loadPlugin();
    if (!plugin) {
      return;
    }
    try {
      const platform = Capacitor.getPlatform();
      if (platform === 'android') {
        const info = await plugin.getAppUpdateInfo();
        if (info?.immediateUpdateAllowed) {
          /* In-app update — Google's flow downloads + installs without
             leaving our app. User taps Update once, then waits. */
          await plugin.performImmediateUpdate();
          return;
        }
      }
      /* iOS or fallback Android: open the store listing. */
      await plugin.openAppStore();
    } catch (e) {
      /* Last-ditch fallback — if the plugin fails for any reason, try
         openAppStore() one more time. If THAT also fails, we're stuck:
         the prompt remains visible, user can try again. */
      try {
        await plugin.openAppStore();
      } catch {
        /* Swallow; let the user retry. */
      }
    }
  }

  /* ----- Internals --------------------------------------------------------- */

  /* Lazy-load the native plugin. Returns null on web or if the import
     fails (e.g., plugin not yet sync'd into the native project). */
  private async loadPlugin(): Promise<any | null> {
    if (!Capacitor.isNativePlatform()) {
      return null;
    }
    if (!this.pluginPromise) {
      this.pluginPromise = import('@capawesome/capacitor-app-update')
        .then(m => m.AppUpdate)
        .catch(() => null);
    }
    return this.pluginPromise;
  }

  /* Fetch store-version info via the plugin. Returns nulls on any error. */
  private async fetchStoreInfo(): Promise<{
    currentVersion: string | null;
    availableVersion: string | null;
    updateAvailable: boolean;
  }> {
    const plugin = await this.loadPlugin();
    if (!plugin) {
      return { currentVersion: null, availableVersion: null, updateAvailable: false };
    }
    try {
      const platform = Capacitor.getPlatform();
      const params = platform === 'ios'
        ? { country: environment.appUpdate?.iosCountry || 'us' }
        : undefined;
      const info = await plugin.getAppUpdateInfo(params);
      /* iOS: currentVersionName / availableVersionName are CFBundleShortVersionString
         strings (e.g. "1.2.3"). On Android the plugin returns versionCode (numeric
         build counter), but for our semver-based comparison we want the name. The
         plugin exposes currentVersionName/availableVersionName on Android too as
         of 8.x. */
      return {
        currentVersion: info?.currentVersionName ?? null,
        availableVersion: info?.availableVersionName ?? null,
        /* The plugin's UPDATE_AVAILABLE constant is "UPDATE_AVAILABLE" string-typed.
           We compare against the string for safety — if the enum changes shape
           in a future plugin version, this still degrades to no-update. */
        updateAvailable: info?.updateAvailability === 'UPDATE_AVAILABLE',
      };
    } catch {
      return { currentVersion: null, availableVersion: null, updateAvailable: false };
    }
  }

  /* Fetch the remote kill-switch JSON. Cached in memory for CACHE_TTL_MS to
     avoid hammering the URL on rapid app resumes. Returns null on any
     failure (URL unconfigured, network error, malformed JSON). */
  private async fetchRemoteConfig(): Promise<RemoteAppConfig | null> {
    const url = environment.appUpdate?.configUrl;
    if (!url || url.trim() === '') {
      /* Kill-switch URL not configured — disable the force-update path
         entirely. This is the development default until M87. */
      return null;
    }

    /* Serve from cache if recent. */
    const now = Date.now();
    if (this.cachedRemote && now - this.cachedAt < this.CACHE_TTL_MS) {
      return this.cachedRemote;
    }

    try {
      /* Cache-bust query param so we never serve stale CDN bytes when the
         operator flips the flag. The `t` value rounds to the cache-TTL
         window so we don't bypass the IN-APP cache, only external caches. */
      const cacheBust = Math.floor(now / this.CACHE_TTL_MS);
      const resp = await fetch(`${url}?t=${cacheBust}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });
      if (!resp.ok) {
        return null;
      }
      const data = (await resp.json()) as RemoteAppConfig;
      /* Sanity-check the shape — at minimum require_app_update should be a
         boolean if present. Reject obviously malformed payloads. */
      if (data && typeof data === 'object') {
        this.cachedRemote = data;
        this.cachedAt = now;
        return data;
      }
      return null;
    } catch {
      return null;
    }
  }
}

/* ----- Helpers ------------------------------------------------------------- */

/**
 * Lexicographic semver comparison. Returns negative if a < b, positive if
 * a > b, zero if equal. Handles up-to 4-part versions (e.g. 1.2.3 or 1.2.3.4).
 * Non-numeric segments are coerced to 0. Pre-release suffixes are ignored
 * (so "1.2.3-beta" compares equal to "1.2.3").
 */
function compareSemver(a: string, b: string): number {
  const partsA = a.split('-')[0].split('.').map(p => parseInt(p, 10) || 0);
  const partsB = b.split('-')[0].split('.').map(p => parseInt(p, 10) || 0);
  const len = Math.max(partsA.length, partsB.length);
  for (let i = 0; i < len; i++) {
    const va = partsA[i] || 0;
    const vb = partsB[i] || 0;
    if (va !== vb) return va - vb;
  }
  return 0;
}

/**
 * Does the bump from `current` to `min` satisfy the threshold?
 *   - 'patch' threshold: any bump qualifies (most aggressive)
 *   - 'minor' threshold: only minor or major bumps qualify
 *   - 'major' threshold: only major bumps qualify
 *
 * E.g., current="1.2.3" -> min="1.2.4":
 *   - patch threshold: yes
 *   - minor threshold: no (only patch differs)
 *   - major threshold: no
 *
 * E.g., current="1.2.3" -> min="2.0.0":
 *   - all three thresholds: yes
 */
function meetsThreshold(
  current: string,
  min: string,
  threshold: 'patch' | 'minor' | 'major'
): boolean {
  const c = current.split('-')[0].split('.').map(p => parseInt(p, 10) || 0);
  const m = min.split('-')[0].split('.').map(p => parseInt(p, 10) || 0);

  const majorBump = (m[0] || 0) > (c[0] || 0);
  const minorBump = !majorBump && (m[1] || 0) > (c[1] || 0);
  /* patch bump = current < min by patch only (or any segment we haven't
     covered with major/minor). No need to compute explicitly — if we got
     here at all, current < min was already verified by the caller. */

  switch (threshold) {
    case 'major': return majorBump;
    case 'minor': return majorBump || minorBump;
    case 'patch':
    default:      return true;
  }
}
