// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,

  /* Google Places API (New) configuration.
   *
   * The key below is for development. It MUST be restricted in
   * Google Cloud Console:
   *   - Application restrictions: HTTP referrers — limit to localhost
   *     (http://localhost, capacitor://localhost, https://localhost)
   *   - API restrictions: Places API (New) only
   *
   * Without these restrictions a leaked key can be abused to consume
   * paid quota. Even with restrictions, set a usage quota cap in the
   * Cloud Console as a hard cost ceiling.
   *
   * If the key is missing or empty, the <ax-place-autocomplete>
   * component degrades gracefully to a plain text field.
   */
  googlePlaces: {
    apiKey: 'AIzaSyAHERMyCn9KfrhZF5zpKynzLp0SjXpQpKU',
    /* ISO 3166-1 alpha-2 country code(s) to restrict autocomplete to. */
    regions: ['AE']
  }
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
