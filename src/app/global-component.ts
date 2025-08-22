import {ReplaySubject} from "rxjs";

export class GlobalComponent {
  constructor() {}
  public static baseURL = 'https://api.3bayti.com/' // test

  /* POST REQUEST */
  public static UserLogin = GlobalComponent.baseURL + 'users/login';
  public static UserRegister = GlobalComponent.baseURL + 'users/register';
  public static UserValidate = GlobalComponent.baseURL + 'users/validate';
  public static EmailValidate = GlobalComponent.baseURL + 'users/validate-email';
  public static ProductCategory = GlobalComponent.baseURL + 'customer/category';
  public static UserConfirm = GlobalComponent.baseURL + 'users/confirm';



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
}
