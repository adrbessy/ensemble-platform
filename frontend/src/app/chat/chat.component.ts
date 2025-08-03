import { Component, OnInit, AfterViewChecked, ViewChild, ElementRef, ChangeDetectorRef, HostListener } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { User } from '../models/user.model';
import { UserService } from '../services/user.service';
import { ChatService } from '../services/chat.service';


@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit, AfterViewChecked {
@ViewChild('messagesContainer') messagesContainer!: ElementRef;

  showEmojiPicker = false;

  @ViewChild('emojiPicker') emojiPickerRef: ElementRef | undefined;
  @ViewChild('emojiButton') emojiButtonRef: ElementRef | undefined;


  friends: User[] = [];

  constructor(private chatService: ChatService, private userService: UserService,
    private cdr: ChangeDetectorRef 
  ) {}

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  scrollToBottom() {
    if (this.messagesContainer) {
      try {
        this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
      } catch (err) {}
    }
  }

  conversations: any[] = [];

  selectedConv: any = null;
  newMessage = '';
  currentUserId!: number;

  ngOnInit(): void {
    this.userService.getCurrentUser().subscribe({
      next: (user) => {
        this.currentUserId = user.id;

        // Ensuite on charge les amis et les messages
        this.loadContacts();
      },
      error: (err) => {
        console.error('Erreur lors de la récupération de l\'utilisateur courant', err);
      }
    });
  }

@HostListener('document:click', ['$event'])
handleClickOutside(event: MouseEvent) {
  const clickedInsidePicker = this.emojiPickerRef?.nativeElement.contains(event.target);
  const clickedEmojiButton = this.emojiButtonRef?.nativeElement.contains(event.target);

  if (this.showEmojiPicker && !clickedInsidePicker && !clickedEmojiButton) {
    this.showEmojiPicker = false;
  }
}


  loadContacts() {
    this.userService.getContacts().subscribe({
      next: (friends) => {
        this.friends = friends;

        this.conversations = friends.map(friend => ({
          id: friend.id,
          name: `${friend.firstName} ${friend.lastName}`,
          photoFilename: friend.photoFilename,
          lastMessage: '',
          messages: []
        }));

        if (this.conversations.length > 0) {
          this.selectConversation(this.conversations[0]);
        }
      },
      error: (err) => {
        console.error('Erreur lors du chargement des amis', err);
      }
    });
  }

  addEmoji(event: any) {
    console.log(event); // test
    this.newMessage += event.emoji.native;
  }


  selectConversation(conv: any) {
    this.selectedConv = conv;

    if (conv.messages.length === 0) {
      this.chatService.getMessages(conv.id).subscribe({
        next: (msgs) => {
          conv.messages = msgs;
          this.cdr.detectChanges();  // force l'update de la vue
        },
        error: (err) => {
          console.error("Erreur lors du chargement des messages", err);
        }
      });
    }
  }


sendMessage() {
  if (!this.newMessage.trim() || !this.selectedConv) return;

  this.chatService.sendMessage(this.selectedConv.id, this.newMessage.trim()).subscribe({
    next: () => {
      this.selectedConv.messages.push({
        senderId: this.currentUserId,
        sender: { id: this.currentUserId }, // ← ajoute ceci pour que msg.sender.id fonctionne
        recipientId: this.selectedConv.id,
        content: this.newMessage.trim(),
        timestamp: new Date().toISOString()
      });
      this.newMessage = '';
    },
    error: (err) => {
      console.error("Erreur d'envoi", err);
    }
  });
}


}

