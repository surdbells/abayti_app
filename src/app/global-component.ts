import {ReplaySubject} from "rxjs";

export class GlobalComponent {
  constructor() {}
  public static baseURL = 'https://api.3bayti.com/' // test
  public static topexCitiesURL = 'https://shipperapi.topex.ae/api/CommonAPI/Cities?countryID=1' //
  public static topexAreaURL = 'https://shipperapi.topex.ae/api/CommonAPI/Areas?acityID=' //

  /* POST REQUEST */
  public static UserLogin = GlobalComponent.baseURL + 'users/login';
  public static UserRegister = GlobalComponent.baseURL + 'users/register';
  public static UserValidate = GlobalComponent.baseURL + 'users/validate';
  public static EmailValidate = GlobalComponent.baseURL + 'users/validate-email';
  public static ProductCategory = GlobalComponent.baseURL + 'customer/category';
  public static topexCities = GlobalComponent.topexCitiesURL;
  public static UserConfirm = GlobalComponent.baseURL + 'users/confirm';
  public static UpdateLocation = GlobalComponent.baseURL + 'customer/settings/update-location';

  // Measurement
  public static readMeasurement = GlobalComponent.baseURL + 'customer/settings/measurement/read-measurement';
  public static updateMeasurement = GlobalComponent.baseURL + 'customer/settings/measurement/update-measurement';

  public static readBilling = GlobalComponent.baseURL + 'customer/settings/billing/read-billings';
  public static updateBilling = GlobalComponent.baseURL + 'customer/settings/billing/update-billing';


  public static readReviews = GlobalComponent.baseURL + 'customer/settings/read-reviews';
  public static storeReviews = GlobalComponent.baseURL + 'customer/settings/store-reviews';
  public static deleteReview = GlobalComponent.baseURL + 'customer/settings/delete-review';
  public static readProfile = GlobalComponent.baseURL + 'customer/settings/read-profile';
  public static updateProfile = GlobalComponent.baseURL + 'customer/settings/update-profile';

  public static readWishlist = GlobalComponent.baseURL + 'customer/read_wishlist';
  public static readWishlistLabel = GlobalComponent.baseURL + 'customer/read_wishlist_label';
  public static addWishlistLabel = GlobalComponent.baseURL + 'customer/add_wishlist_label';
  public static addWishlist = GlobalComponent.baseURL + 'customer/add_wishlist';
  public static addToCart = GlobalComponent.baseURL + 'customer/addToCart';

  public static filtered_products = GlobalComponent.baseURL + 'customer/filter_product';
  public static best_sellers = GlobalComponent.baseURL + 'customer/best_sellers';
  public static customerCart = GlobalComponent.baseURL + 'customer/read-cart';
  public static RemoveCartItem = GlobalComponent.baseURL + 'customer/removeFromCart';
  public static IncreaseItem = GlobalComponent.baseURL + 'customer/IncreaseItem';
  public static DecreaseItem = GlobalComponent.baseURL + 'customer/decreaseItem';
  public static explore = GlobalComponent.baseURL + 'customer/explore';
  public static featured = GlobalComponent.baseURL + 'customer/featured';
  public static product_by_category = GlobalComponent.baseURL + 'customer/product_by_category';
  public static products_by_labels = GlobalComponent.baseURL + 'customer/products_by_labels';
  public static search = GlobalComponent.baseURL + 'customer/search';
  public static store_labels = GlobalComponent.baseURL + 'customer/read_vendor_collection';
  public static store_latest = GlobalComponent.baseURL + 'customer/store_latest';
  public static singleProduct = GlobalComponent.baseURL + 'customer/singleProduct';


  // ordering process

  public static initiatePayment = GlobalComponent.baseURL + 'customer/payment/initiate_payment';
  public static finalizePayment = GlobalComponent.baseURL + 'customer/payment/finalize_payment';

  static validateEmail(email: string) {
    return !!email.match(/(?:[a-z0-9+!#$%&'*/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)])/gi);
  }
  static validateNumber(number: string){
    let numbers = /^[0-9]+$/;
    return !!number.match(numbers);
  }

  public static StripePublicKey = 'pk_live_51LoXZtDpGyy9me6FXi8GPmjnURCVAKDkPKIMMS0GAYXwDIG11nXea9MbSI73QgfFBSt83MwGWmrQR6YKA6T0tK3n00WM36z7vK' // public
  public static StripeSecretKey = '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' // secret
  static convertFile(file : File) {
    const result = new ReplaySubject<string>(1);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event: any) => result.next(btoa(event.target.result.toString()));
    return result;
  }
  public static generateTransactionReference(prefix: string = 'TRN'): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8); // 6 characters for randomness
    return `${prefix}-${timestamp}-${randomString}`.toUpperCase();
  }
}
