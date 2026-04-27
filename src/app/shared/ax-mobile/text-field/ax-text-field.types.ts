/**
 * Public types for the abayti mobile text field primitive.
 */

/** Supported native input types. */
export type AxTextFieldType =
  | 'text'
  | 'email'
  | 'password'
  | 'tel'
  | 'number'
  | 'url'
  | 'search';

/** Native inputmode hints (subset we expose). */
export type AxTextFieldInputMode =
  | 'text'
  | 'email'
  | 'tel'
  | 'numeric'
  | 'decimal'
  | 'search'
  | 'url';
