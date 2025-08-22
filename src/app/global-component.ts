import {ReplaySubject} from "rxjs";

export class GlobalComponent {
  constructor() {}
  public static baseURL = 'https://api.myfiesta.ca/' // prod
  //public static baseURL = 'http://localhost/FiestaAPI/' // test

  /* POST REQUEST */
  public static StripeCheckout = GlobalComponent.baseURL + 'ticket/StripeCheckout';
  public static StripeWebCheckout = GlobalComponent.baseURL + 'ticket/StripeWebCheckout';
  public static RequestTicket = GlobalComponent.baseURL + 'ticket/RequestTicket';
  public static CompleteSuccessTransaction = GlobalComponent.baseURL + 'ticket/CompleteSuccessTransaction';
  public static ValidateTicket = GlobalComponent.baseURL + 'ticket/ValidateTicket';
  public static HostSignIn = GlobalComponent.baseURL + 'host/HostSignIn';
  public static HostRegister = GlobalComponent.baseURL + 'host/HostRegister';
  public static HostStatistics = GlobalComponent.baseURL + 'host/Statistics';
  public static HostTransactions = GlobalComponent.baseURL + 'host/Transactions';
  public static HostAllTrx = GlobalComponent.baseURL + 'host/HostAllTrx';
  public static HostEventTransactions = GlobalComponent.baseURL + 'host/HostEventTransactions';
  public static HostEventGuests = GlobalComponent.baseURL + 'host/HostEventGuests';
  public static HostEventMessages = GlobalComponent.baseURL + 'host/HostEventMessages';
  public static HostSendMessages = GlobalComponent.baseURL + 'host/HostSendMessages';
  public static HostEvents = GlobalComponent.baseURL + 'host/HostEvents';
  public static CreateEvent = GlobalComponent.baseURL + 'host/CreateEvent';
  public static HostUpdateEventById = GlobalComponent.baseURL + 'host/HostUpdateEventById';
  public static HostSingleEventById = GlobalComponent.baseURL + 'host/HostSingleEventById';
  public static HostEventTickets = GlobalComponent.baseURL + 'host/HostEventTickets';
  public static HostEventTicketsById = GlobalComponent.baseURL + 'host/HostEventTicketsById';
  public static HostUpdateTicketsById = GlobalComponent.baseURL + 'host/HostUpdateTicketsById';
  public static HostUpdateEventPoster = GlobalComponent.baseURL + 'host/HostUpdateEventPoster';
  public static HostUpdateEventStatus = GlobalComponent.baseURL + 'host/HostUpdateEventStatus';
  public static HostUpdateUserProfile = GlobalComponent.baseURL + 'host/HostUpdateUserProfile';
  public static HostUpdateUserPhoto = GlobalComponent.baseURL + 'host/HostUpdateUserPhoto';
  public static HostUpdateUserBrand = GlobalComponent.baseURL + 'host/HostUpdateUserBrand';
  public static HostUpdateUserIdentity = GlobalComponent.baseURL + 'host/HostUpdateUserIdentity';
  public static HostUpdateUserPassword = GlobalComponent.baseURL + 'host/HostUpdateUserPassword';
  public static HostUpdatePassword = GlobalComponent.baseURL + 'host/HostUpdatePassword';
  public static HostUpdateUserPayment = GlobalComponent.baseURL + 'host/HostUpdateUserPayment';
  public static HostBrandProfile = GlobalComponent.baseURL + 'host/HostBrandProfile';
  public static HostDeleteTicketsById = GlobalComponent.baseURL + 'host/HostDeleteTicketsById';
  public static HostCreateTicket = GlobalComponent.baseURL + 'host/HostCreateTicket';
  public static HostCreateFreeTicket = GlobalComponent.baseURL + 'host/HostCreateFreeTicket';
  public static HostCreateRSVP = GlobalComponent.baseURL + 'host/HostCreateRSVP';
  public static TransferCustomerTicket = GlobalComponent.baseURL + 'ticket/TransferTicket';

  /* GET REQUESTS WITH NO PARAMETERS */
  public static GetCategory = GlobalComponent.baseURL + 'category/GetAllCategory';
  public static GetAllLocations = GlobalComponent.baseURL + 'location/GetAllLocations';
  public static GetUpcomingEvents = GlobalComponent.baseURL + 'events/GetUpcomingEvents';
  public static GetPastEvents = GlobalComponent.baseURL + 'events/GetPastEvents';
  public static GetTrendingEvents = GlobalComponent.baseURL + 'events/GetTrendingEvents';
  public static GetFeaturedEvents = GlobalComponent.baseURL + 'events/GetFeaturedEvents';
  public static FeaturedEvents = GlobalComponent.baseURL + 'events/GetFeaturedEvents';
  public static GetAllEvent = GlobalComponent.baseURL + 'events/GetAllEvent';
  public static GetCity = GlobalComponent.baseURL + 'events/GetCity';
  public static GetType = GlobalComponent.baseURL + 'events/GetType';
  public static GetTicketType = GlobalComponent.baseURL + 'events/GetTicketType';
  public static GetDress = GlobalComponent.baseURL + 'events/GetDress';

  /* GET REQUESTS WITH PARAMETERS */
  public static EventByCategory = GlobalComponent.baseURL + 'events/EventByCategory/';
  public static EventByLocation = GlobalComponent.baseURL + 'events/EventByLocation/';
  public static SingleEvent = GlobalComponent.baseURL + 'events/SingleEvent/';
  public static SingleEventBySlug = GlobalComponent.baseURL + 'events/SingleEventBySlug/';
  public static EventTickets = GlobalComponent.baseURL + 'ticket/EventTickets/';
  public static GetCustomerEventTickets = GlobalComponent.baseURL + 'ticket/GetCustomerEventTickets/';
  public static SaleEventTickets = GlobalComponent.baseURL + 'ticket/SaleEventTickets/';
  public static SendValidationEmailOTP = GlobalComponent.baseURL + 'ticket/SendValidationEmailOTP/';
  public static ValidateSingleHost = GlobalComponent.baseURL + 'user/ValidateSingleHost/';
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
