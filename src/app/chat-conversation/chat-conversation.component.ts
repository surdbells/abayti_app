import {Component, Input, ChangeDetectionStrategy, OnInit, ViewChild, ElementRef} from '@angular/core';
import {Preferences} from "@capacitor/preferences";
import {CommonModule} from "@angular/common";

export interface Message {
  id: number;
  conversationId: number;
  senderId: number;
  senderType?: 'customer'|'store';
  content: string;
  attachment?: string;
  status?: 'sent'|'delivered'|'read';
  createdAt: string; // ISO string
  senderName?: string;
  senderAvatar?: string; // optional URL
}

@Component({
  selector: 'app-chat-conversation',
  templateUrl: './chat-conversation.component.html',
  styleUrls: ['./chat-conversation.component.scss'],
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChatConversationComponent{
  @Input() messages: Message[] = [];
  @Input() currentUserId!: number; // required - id of logged in user
  @Input() showTimestamps = true;
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef<HTMLDivElement>;

  private shouldScroll = false;

  ngAfterViewInit() {
    this.scrollToBottom(); // initial scroll
  }

  ngAfterViewChecked() {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  // Called when new @Input messages arrive
  ngOnChanges() {
    this.shouldScroll = true;
  }

  private scrollToBottom(): void {
    try {
      this.scrollContainer.nativeElement.scrollTop =
        this.scrollContainer.nativeElement.scrollHeight;
    } catch (err) {
      console.warn('Scroll failed', err);
    }
  }
  // helper: true if message is outgoing (from current user)
  isOutgoing(m: Message) {
    return m.senderId === this.currentUserId;
  }

   // Create initials from name (max 2 letters). Fallback to '?'.
  initials(name?: string): string {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
      // take first two letters of single name
      return parts[0].slice(0, 2).toUpperCase();
    }
    // take first letters of first and last
    const first = parts[0].charAt(0);
    const last = parts[parts.length - 1].charAt(0);
    return (first + last).toUpperCase();
  }

  // Deterministic color generator from a string (name). Returns HSL color.
  avatarColor(name?: string): string {
    const seed = (name || 'unknown').split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    // pick hue based on seed, keep saturation/lightness constant for readability
    const hue = seed % 360;
    const saturation = 65;
    const lightness = 50;
    return `hsl(${hue} ${saturation}% ${lightness}%)`;
  }

  // Optionally use this to decide text color based on bg (simple contrast)
  avatarTextColor(name?: string): string {
    // compute a simple luminance from hue -> pick white/black accordingly
    const hue = (name || 'unknown').split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % 360;
    // mid hues around 200 (blue) can be darker or lighter; simple rule: use white for most
    return '#fff';
  }
}
