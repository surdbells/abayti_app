import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { NetworkService } from './network.service';
import { GlobalComponent } from '../app/global-component';
import {
  ChatVendor,
  ChatOrder,
  Conversation,
  OrderContext,
  ChatMessage,
  PromptCategory,
  ChatOrdersResponse,
  ConversationResponse,
  MessagesResponse,
  SendMessageResponse,
  VendorConversationsResponse,
  UnreadCountResponse
} from '../models/chat.models';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private currentConversation$ = new BehaviorSubject<Conversation | null>(null);
  private orderContext$ = new BehaviorSubject<OrderContext | null>(null);
  private messages$ = new BehaviorSubject<ChatMessage[]>([]);
  private promptCategories$ = new BehaviorSubject<PromptCategory[]>([]);
  private unreadCount$ = new BehaviorSubject<UnreadCountResponse>({ customer_unread: 0, vendor_unread: 0, total: 0 });

  constructor(private networkService: NetworkService) {}

  // ========================================
  // Customer: Vendor Discovery
  // ========================================

  getVendorsWithOrders(userId: number, token: string): Observable<ChatVendor[]> {
    return this.networkService.post_request(
      { id: userId, token },
      GlobalComponent.chat_get_vendors
    ).pipe(
      map(response => response.status === 'success' ? response.data : []),
      catchError(() => of([]))
    );
  }

  getVendorOrders(userId: number, token: string, vendorId: number): Observable<ChatOrdersResponse> {
    return this.networkService.post_request(
      { id: userId, token, vendor_id: vendorId },
      GlobalComponent.chat_get_vendor_orders
    ).pipe(
      map(response => response.status === 'success' ? response.data : { orders: [], total_count: 0, skip_selection: false }),
      catchError(() => of({ orders: [], total_count: 0, skip_selection: false }))
    );
  }

  // ========================================
  // Conversation Management
  // ========================================

  getOrCreateConversation(userId: number, token: string, orderItemId: number): Observable<ConversationResponse> {
    return this.networkService.post_request(
      { id: userId, token, order_item_id: orderItemId },
      GlobalComponent.chat_get_conversation
    ).pipe(
      tap(response => {
        if (response.status === 'success') {
          this.currentConversation$.next(response.data.conversation);
          this.orderContext$.next(response.data.order_context);
        }
      }),
      map(response => {
        if (response.status === 'success') return response.data;
        throw new Error(response.message || 'Failed to load conversation');
      })
    );
  }

  getVendorConversations(userId: number, token: string, limit = 50, offset = 0): Observable<VendorConversationsResponse> {
    return this.networkService.post_request(
      { id: userId, token, limit, offset },
      GlobalComponent.chat_get_vendor_conversations
    ).pipe(
      map(response => response.status === 'success' ? response.data : { conversations: [], total_unread: 0, has_more: false }),
      catchError(() => of({ conversations: [], total_unread: 0, has_more: false }))
    );
  }

  // ========================================
  // Messages
  // ========================================

  getMessages(userId: number, token: string, conversationId: number, beforeId?: number, limit = 50): Observable<MessagesResponse> {
    const params: any = { id: userId, token, conversation_id: conversationId, limit };
    if (beforeId) params.before_id = beforeId;

    return this.networkService.post_request(params, GlobalComponent.chat_get_messages).pipe(
      tap(response => {
        if (response.status === 'success') {
          if (!beforeId) {
            this.messages$.next(response.data.messages);
          } else {
            const current = this.messages$.value;
            this.messages$.next([...response.data.messages, ...current]);
          }
        }
      }),
      map(response => response.status === 'success' ? response.data : { messages: [], has_more: false }),
      catchError(() => of({ messages: [], has_more: false }))
    );
  }

  sendMessage(userId: number, token: string, conversationId: number, content: string, promptId?: number): Observable<SendMessageResponse> {
    const params: any = {
      id: userId,
      token,
      conversation_id: conversationId,
      content,
      message_type: promptId ? 'prompt' : 'text'
    };
    if (promptId) params.prompt_id = promptId;

    return this.networkService.post_request(params, GlobalComponent.chat_send_message).pipe(
      tap(response => {
        if (response.status === 'success') {
          const current = this.messages$.value;
          this.messages$.next([...current, response.data.message]);
        }
      }),
      map(response => {
        if (response.status === 'success') return response.data;
        throw new Error(response.message || 'Failed to send message');
      })
    );
  }

  uploadImage(userId: number, token: string, conversationId: number, file: File): Observable<SendMessageResponse> {
    const formData = new FormData();
    formData.append('id', userId.toString());
    formData.append('token', token);
    formData.append('conversation_id', conversationId.toString());
    formData.append('image', file);

    return this.networkService.post_form_data(formData, GlobalComponent.chat_upload_image).pipe(
      tap(response => {
        if (response.status === 'success') {
          const current = this.messages$.value;
          this.messages$.next([...current, response.data.message]);
        }
      }),
      map(response => {
        if (response.status === 'success') return response.data;
        throw new Error(response.message || 'Failed to upload image');
      })
    );
  }

  markAsRead(userId: number, token: string, conversationId: number): Observable<boolean> {
    return this.networkService.post_request(
      { id: userId, token, conversation_id: conversationId },
      GlobalComponent.chat_mark_read
    ).pipe(
      map(response => response.status === 'success'),
      catchError(() => of(false))
    );
  }

  // ========================================
  // Prompts
  // ========================================

  getPrompts(lang = 'en'): Observable<PromptCategory[]> {
    return this.networkService.post_request({ lang }, GlobalComponent.chat_get_prompts).pipe(
      tap(response => {
        if (response.status === 'success') {
          this.promptCategories$.next(response.data);
        }
      }),
      map(response => response.status === 'success' ? response.data : []),
      catchError(() => of([]))
    );
  }

  // ========================================
  // Unread Count
  // ========================================

  getUnreadCount(userId: number, token: string): Observable<UnreadCountResponse> {
    return this.networkService.post_request(
      { id: userId, token },
      GlobalComponent.chat_get_unread_count
    ).pipe(
      tap(response => {
        if (response.status === 'success') {
          this.unreadCount$.next(response.data);
        }
      }),
      map(response => response.status === 'success' ? response.data : { customer_unread: 0, vendor_unread: 0, total: 0 }),
      catchError(() => of({ customer_unread: 0, vendor_unread: 0, total: 0 }))
    );
  }

  // ========================================
  // Observable Getters
  // ========================================

  getCurrentConversation(): Observable<Conversation | null> {
    return this.currentConversation$.asObservable();
  }

  getOrderContext(): Observable<OrderContext | null> {
    return this.orderContext$.asObservable();
  }

  getMessagesStream(): Observable<ChatMessage[]> {
    return this.messages$.asObservable();
  }

  getPromptsStream(): Observable<PromptCategory[]> {
    return this.promptCategories$.asObservable();
  }

  getUnreadCountStream(): Observable<UnreadCountResponse> {
    return this.unreadCount$.asObservable();
  }

  // ========================================
  // State Management
  // ========================================

  addOptimisticMessage(message: ChatMessage): void {
    const current = this.messages$.value;
    this.messages$.next([...current, message]);
  }

  replaceMessage(tempUuid: string, confirmedMessage: ChatMessage): void {
    const messages = this.messages$.value.map(m => m.uuid === tempUuid ? confirmedMessage : m);
    this.messages$.next(messages);
  }

  updateMessageStatus(messageId: number, status: ChatMessage['status']): void {
    const messages = this.messages$.value.map(m => m.message_id === messageId ? { ...m, status } : m);
    this.messages$.next(messages);
  }

  clearChat(): void {
    this.currentConversation$.next(null);
    this.orderContext$.next(null);
    this.messages$.next([]);
  }

  resetState(): void {
    this.clearChat();
    this.promptCategories$.next([]);
    this.unreadCount$.next({ customer_unread: 0, vendor_unread: 0, total: 0 });
  }
}
