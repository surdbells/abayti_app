import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
  AfterViewInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonFooter,
  IonModal,
  IonIcon,
  IonSpinner,
  NavController,
  Platform
} from '@ionic/angular/standalone';
import { TuiIcon } from '@taiga-ui/core';
import { Subscription } from 'rxjs';
import { Preferences } from '@capacitor/preferences';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

import { ChatService } from '../../../services/chat.service';
import { TranslateService } from '../../../services/translate.service';
import { 
  ChatMessage, 
  OrderContext, 
  PromptCategory, 
  Prompt, 
  Conversation,
  ChatAttachment,
  OrderStatus,
  MessageStatus
} from '../../../models/chat.models';
import { TranslatePipe } from '../../../translate.pipe';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.page.html',
  styleUrls: ['./chat.page.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonFooter,
    IonModal,
    IonIcon,
    IonSpinner,
    TuiIcon,
    TranslatePipe
  ]
})
export class ChatPage implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('chatContent', { static: false }) chatContent!: IonContent;
  @ViewChild('messageInput', { static: false }) messageInput!: ElementRef<HTMLTextAreaElement>;
  @ViewChild('fileInput', { static: false }) fileInput!: ElementRef<HTMLInputElement>;

  // User data
  userId = 0;
  userToken = '';
  userRole: 'customer' | 'vendor' = 'customer';
  currentLang = 'en';

  // Conversation state
  conversation: Conversation | null = null;
  orderContext: OrderContext | null = null;
  messages: ChatMessage[] = [];
  canSend = true;

  // Prompts
  promptCategories: PromptCategory[] = [];
  selectedCategory: PromptCategory | null = null;

  // UI state
  messageText = '';
  isLoading = true;
  isLoadingMore = false;
  isSending = false;
  isUploading = false;
  isOrderModalOpen = false;
  isImageViewerOpen = false;
  hasMoreMessages = true;
  imageLoaded = false;

  // Image viewer
  viewingImage: ChatAttachment | null = null;

  private subscriptions: Subscription[] = [];
  private orderItemId = 0;
  private isScrolledToBottom = true;

  constructor(
    private chatService: ChatService,
    private translateService: TranslateService,
    private route: ActivatedRoute,
    private router: Router,
    private nav: NavController,
    private platform: Platform,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.orderItemId = Number(params['order_item_id']);
      if (this.orderItemId) {
        this.initializeChat();
      } else {
        this.router.navigate(['/chat-vendors']);
      }
    });

    this.currentLang = this.translateService.getCurrentLang();
  }

  ngAfterViewInit() {
    // Auto-focus input after view init
    setTimeout(() => {
      this.focusInput();
    }, 500);
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.chatService.clearChat();
  }

  async initializeChat() {
    const userData = await Preferences.get({ key: 'user' });
    if (!userData.value) {
      this.router.navigate(['/login']);
      return;
    }

    const user = JSON.parse(userData.value);
    this.userId = user.id;
    this.userToken = user.token;

    // Load conversation
    this.loadConversation();
    
    // Load prompts
    this.loadPrompts();
  }

  loadConversation() {
    this.isLoading = true;
    this.cdr.markForCheck();

    const sub = this.chatService.getOrCreateConversation(this.userId, this.userToken, this.orderItemId)
      .subscribe({
        next: (data) => {
          this.conversation = data.conversation;
          this.orderContext = data.order_context;
          this.canSend = data.can_send;
          this.userRole = data.user_role;
          
          // Load messages
          this.loadMessages();
        },
        error: (err) => {
          console.error('Failed to load conversation:', err);
          this.isLoading = false;
          this.cdr.markForCheck();
        }
      });

    this.subscriptions.push(sub);
  }

  loadMessages(beforeId?: number) {
    if (!this.conversation) return;

    if (beforeId) {
      this.isLoadingMore = true;
    } else {
      this.isLoading = true;
    }
    this.cdr.markForCheck();

    const sub = this.chatService.getMessages(
      this.userId, 
      this.userToken, 
      this.conversation.conversation_id,
      beforeId
    ).subscribe({
      next: (data) => {
        if (beforeId) {
          // Prepend older messages
          this.messages = [...data.messages, ...this.messages];
        } else {
          // Initial load
          this.messages = data.messages;
          // Scroll to bottom on initial load
          setTimeout(() => this.scrollToBottom(), 100);
        }
        this.hasMoreMessages = data.has_more;
        this.isLoading = false;
        this.isLoadingMore = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Failed to load messages:', err);
        this.isLoading = false;
        this.isLoadingMore = false;
        this.cdr.markForCheck();
      }
    });

    this.subscriptions.push(sub);
  }

  loadPrompts() {
    const sub = this.chatService.getPrompts(this.currentLang).subscribe({
      next: (categories) => {
        this.promptCategories = categories;
        if (categories.length > 0) {
          this.selectedCategory = categories[0];
        }
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Failed to load prompts:', err)
    });

    this.subscriptions.push(sub);
  }

  // ========================================
  // Message Sending
  // ========================================

  sendMessage() {
    if (!this.conversation || !this.messageText.trim() || this.isSending) return;

    const content = this.messageText.trim();
    this.messageText = '';
    this.resetTextarea();
    this.isSending = true;
    this.cdr.markForCheck();

    // Add optimistic message
    const tempId = Date.now();
    const tempUuid = 'temp-' + tempId;
    const tempMessage: ChatMessage = {
      message_id: tempId,
      uuid: tempUuid,
      conversation_id: this.conversation.conversation_id,
      sender_id: this.userId,
      sender_type: this.userRole,
      message_type: 'text',
      content: content,
      content_ar: null,
      prompt_id: null,
      prompt_category: null,
      has_attachments: false,
      status: 'sending',
      delivered_at: null,
      read_at: null,
      is_flagged: false,
      created_at: new Date().toISOString(),
      sender_name: ''
    };
    
    this.messages = [...this.messages, tempMessage];
    this.scrollToBottom();
    this.triggerHaptic();
    this.cdr.markForCheck();

    const sub = this.chatService.sendMessage(
      this.userId,
      this.userToken,
      this.conversation.conversation_id,
      content
    ).subscribe({
      next: (data) => {
        // Replace temp message with real one
        this.messages = this.messages.map(m => 
          m.uuid === tempUuid ? data.message : m
        );
        this.isSending = false;
        this.scrollToBottom();
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Failed to send message:', err);
        // Mark as failed
        this.messages = this.messages.map(m =>
          m.uuid === tempUuid ? { ...m, status: 'failed' as MessageStatus } : m
        );
        this.isSending = false;
        this.cdr.markForCheck();
      }
    });

    this.subscriptions.push(sub);
  }

  sendPrompt(prompt: Prompt) {
    if (!this.conversation || this.isSending) return;

    const content = prompt.text;
    this.isSending = true;
    this.cdr.markForCheck();

    // Add optimistic message
    const tempId = Date.now();
    const tempUuid = 'temp-' + tempId;
    const tempMessage: ChatMessage = {
      message_id: tempId,
      uuid: tempUuid,
      conversation_id: this.conversation.conversation_id,
      sender_id: this.userId,
      sender_type: this.userRole,
      message_type: 'prompt',
      content: content,
      content_ar: prompt.text_ar,
      prompt_id: prompt.prompt_id,
      prompt_category: this.selectedCategory?.slug || null,
      has_attachments: false,
      status: 'sending',
      delivered_at: null,
      read_at: null,
      is_flagged: false,
      created_at: new Date().toISOString(),
      sender_name: ''
    };
    
    this.messages = [...this.messages, tempMessage];
    this.scrollToBottom();
    this.triggerHaptic();
    this.cdr.markForCheck();

    const sub = this.chatService.sendMessage(
      this.userId,
      this.userToken,
      this.conversation.conversation_id,
      content,
      prompt.prompt_id
    ).subscribe({
      next: (data) => {
        this.messages = this.messages.map(m =>
          m.uuid === tempUuid ? data.message : m
        );
        this.isSending = false;
        this.scrollToBottom();
        this.cdr.markForCheck();
      },
      error: () => {
        this.messages = this.messages.map(m =>
          m.uuid === tempUuid ? { ...m, status: 'failed' as MessageStatus } : m
        );
        this.isSending = false;
        this.cdr.markForCheck();
      }
    });

    this.subscriptions.push(sub);
  }

  // ========================================
  // Image Upload
  // ========================================

  triggerImageUpload() {
    if (this.fileInput) {
      this.fileInput.nativeElement.click();
    }
  }

  onImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length || !this.conversation) return;

    const file = input.files[0];
    
    // Validate file size (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('File too large. Maximum size is 5MB.');
      input.value = '';
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      alert('Invalid file type. Please upload JPG, PNG, WebP, or GIF.');
      input.value = '';
      return;
    }

    this.isUploading = true;
    this.cdr.markForCheck();

    const sub = this.chatService.uploadImage(
      this.userId,
      this.userToken,
      this.conversation.conversation_id,
      file
    ).subscribe({
      next: (data) => {
        this.messages = [...this.messages, data.message];
        this.isUploading = false;
        this.scrollToBottom();
        this.triggerHaptic();
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Upload failed:', err);
        alert('Failed to upload image. Please try again.');
        this.isUploading = false;
        this.cdr.markForCheck();
      }
    });

    this.subscriptions.push(sub);

    // Reset input
    input.value = '';
  }

  // ========================================
  // UI Helpers
  // ========================================

  selectCategory(category: PromptCategory) {
    this.selectedCategory = category;
    this.triggerHaptic('light');
    this.cdr.markForCheck();
  }

  isOwnMessage(message: ChatMessage): boolean {
    return message.sender_id === this.userId;
  }

  shouldShowDateSeparator(message: ChatMessage, index: number): boolean {
    if (index === 0) return true;
    const prevMessage = this.messages[index - 1];
    const prevDate = new Date(prevMessage.created_at).toDateString();
    const currDate = new Date(message.created_at).toDateString();
    return prevDate !== currDate;
  }

  formatDateSeparator(dateString: string): string {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return this.currentLang === 'ar' ? 'اليوم' : 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return this.currentLang === 'ar' ? 'أمس' : 'Yesterday';
    } else {
      return date.toLocaleDateString(this.currentLang === 'ar' ? 'ar-EG' : 'en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  }

  getStatusClass(status: OrderStatus | string): string {
    const statusMap: Record<string, string> = {
      'Pending': 'status-pending',
      'Accepted': 'status-processing',
      'Processing': 'status-processing',
      'Ready for Delivery': 'status-ready',
      'Delivered': 'status-delivered',
      'Return Requested': 'status-return',
      'Returned': 'status-return',
      'Cancelled': 'status-cancelled',
      'Refunded': 'status-cancelled'
    };
    return statusMap[status] || 'status-pending';
  }

  getMeasurementEntries(): { key: string; value: string }[] {
    if (!this.orderContext?.measurement_parsed) return [];
    return Object.entries(this.orderContext.measurement_parsed).map(([key, value]) => ({
      key,
      value: String(value)
    }));
  }

  onKeyDown(event: KeyboardEvent) {
    // Send on Enter (without Shift)
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  autoGrow() {
    if (!this.messageInput) return;
    const textarea = this.messageInput.nativeElement;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  }

  resetTextarea() {
    if (!this.messageInput) return;
    const textarea = this.messageInput.nativeElement;
    textarea.style.height = 'auto';
  }

  focusInput() {
    if (this.messageInput && this.canSend) {
      this.messageInput.nativeElement.focus();
    }
  }

  scrollToBottom(duration = 300) {
    setTimeout(() => {
      this.chatContent?.scrollToBottom(duration);
    }, 50);
  }

  onScroll(event: any) {
    const scrollTop = event.detail.scrollTop;
    this.isScrolledToBottom = scrollTop > event.detail.scrollHeight - event.detail.offsetHeight - 100;

    // Load more when scrolled near top
    if (scrollTop < 100 && this.hasMoreMessages && !this.isLoadingMore && this.messages.length > 0) {
      const oldestMessage = this.messages[0];
      if (oldestMessage) {
        this.loadMessages(oldestMessage.message_id);
      }
    }
  }

  onPinnedImageLoad() {
    this.imageLoaded = true;
    this.cdr.markForCheck();
  }

  onPinnedImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/img/placeholder-product.png';
    this.imageLoaded = true;
    this.cdr.markForCheck();
  }

  // ========================================
  // Modals
  // ========================================

  openOrderDetails() {
    this.isOrderModalOpen = true;
    this.cdr.markForCheck();
  }

  openImageViewer(attachment: ChatAttachment) {
    this.viewingImage = attachment;
    this.isImageViewerOpen = true;
    this.cdr.markForCheck();
  }

  closeImageViewer() {
    this.isImageViewerOpen = false;
    this.viewingImage = null;
    this.cdr.markForCheck();
  }

  // ========================================
  // Navigation
  // ========================================

  goBack() {
    this.nav.back();
  }

  // ========================================
  // Haptic Feedback
  // ========================================

  async triggerHaptic(style: 'light' | 'medium' | 'heavy' = 'medium') {
    try {
      if (this.platform.is('capacitor')) {
        const impactStyle = style === 'light' ? ImpactStyle.Light : 
                           style === 'heavy' ? ImpactStyle.Heavy : 
                           ImpactStyle.Medium;
        await Haptics.impact({ style: impactStyle });
      }
    } catch (e) {
      // Haptics not available
    }
  }
}
