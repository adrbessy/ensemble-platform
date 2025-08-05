import { Component, OnInit, AfterViewChecked, ViewChild, ElementRef, ChangeDetectorRef, HostListener } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { User } from '../models/user.model';
import { UserService } from '../services/user.service';
import { ChatService } from '../services/chat.service';

type SelectableUser = User & { selected?: boolean };

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


  friends: SelectableUser[] = [];
  selectedUserIds: number[] = [];
  groupName: string = '';

  showCreateGroup = false;

  onGroupCreated() {
    this.showCreateGroup = false;
    this.loadConversations(); 
  }

  loadConversations() {
    this.chatService.getConversations().subscribe({
      next: (convos) => {
        this.conversations = convos.map(conv => ({
          id: conv.id,
          name: conv.type === 'GROUP'
            ? conv.name
            : this.getOtherParticipantName(conv.participants),
          photoFilename: conv.type === 'GROUP'
            ? null
            : this.getOtherParticipantPhoto(conv.participants),
          type: conv.type,
          messages: conv.messages ?? [], // assure-toi que les messages sont chargés
          participants: conv.participants
        }));

        // 🔃 Trie par date du dernier message
        this.conversations.sort((a, b) => {
          const aDate = new Date(a.messages?.at(-1)?.timestamp ?? 0).getTime();
          const bDate = new Date(b.messages?.at(-1)?.timestamp ?? 0).getTime();
          return bDate - aDate;
        });

        if (this.conversations.length > 0) {
          this.selectConversation(this.conversations[0]);
        }
      },
      error: (err) => {
        console.error("❌ Erreur lors du chargement des conversations", err);
      }
    });
  }

  getOtherParticipantName(participants: any[]): string {
    const other = participants.find(p => p.id !== this.currentUserId);
    return other ? `${other.firstName} ${other.lastName}` : "Inconnu";
  }

  getOtherParticipantPhoto(participants: any[]): string | null {
    const other = participants.find(p => p.id !== this.currentUserId);
    return other?.photoFilename ?? null;
  }


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
        this.loadConversations();
        this.loadContacts();

        // 🔔 Abonnement aux messages entrants
        this.chatService.onMessageReceived().subscribe((message: any) => {
          const conv = this.conversations.find(c => c.id === message.conversationId);

          if (conv) {
            conv.messages.push(message);

            // 💬 Mets la conversation en haut
            this.bumpConversationToTop(conv);

            // ✅ Si c’est la conversation ouverte, déclenche une mise à jour
            if (this.selectedConv?.id === conv.id) {
              this.scrollToBottom();
              this.cdr.detectChanges();
            }
          } else {
            // Cas où la conversation n'est pas encore chargée (optionnel)
            this.loadConversations();
          }
        });
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

  startPrivateConversation(friendId: number) {
    this.chatService.getOrCreatePrivateConversation(friendId).subscribe({
      next: (conv) => {
        const exists = this.conversations.some(c => c.id === conv.id);
        if (!exists) {
          this.conversations.push({
            id: conv.id,
            name: this.getOtherParticipantName(conv.participants),
            photoFilename: this.getOtherParticipantPhoto(conv.participants),
            type: conv.type,
            messages: [],
            participants: conv.participants
          });
        }

        this.selectConversation(conv);
      },
      error: (err) => {
        console.error("❌ Erreur lors de la création/récupération de la conversation privée :", err);
      }
    });
  }


  loadContacts() {
    this.userService.getContacts().subscribe({
      next: (friends) => {
        this.friends = friends;
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

    if (!conv.messages || conv.messages.length === 0) {
      this.chatService.getMessagesByConversation(conv.id).subscribe({
        next: (msgs) => {
          console.log("📩 Messages récupérés :", msgs);
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

    this.chatService.sendMessageToConversation(this.selectedConv.id, this.newMessage.trim()).subscribe({
      next: () => {
        const newMsg = {
          senderId: this.currentUserId,
          sender: { id: this.currentUserId },
          content: this.newMessage.trim(),
          timestamp: new Date().toISOString()
        };

        this.selectedConv.messages.push(newMsg);
        this.newMessage = '';

        // 💬 Remonter la conversation
        this.bumpConversationToTop(this.selectedConv);
      },
      error: (err) => {
        console.error("Erreur d'envoi", err);
      }
    });
  }

  bumpConversationToTop(conv: any) {
    const index = this.conversations.findIndex(c => c.id === conv.id);
    if (index > -1) {
      const [conversation] = this.conversations.splice(index, 1);
      this.conversations.unshift(conversation);
    }
  }

  newMembers: number[] = [];

  confirmAddMembers() {
    if (!this.selectedConv) return;

    const selectedIds = this.friends
      .filter(f => f.selected && !this.isAlreadyInConversation(f.id))
      .map(f => f.id);

    if (selectedIds.length === 0) {
      this.closeAddMembersModal();
      return;
    }

    this.chatService.addMembersToConversation(this.selectedConv.id, selectedIds).subscribe({
      next: () => {
        this.loadConversations();
        this.closeAddMembersModal();
      },
      error: (err) => {
        console.error("Erreur lors de l'ajout de membres :", err);
      }
    });
  }


  isAlreadyInConversation(contactId: number): boolean {
    return this.selectedConv?.participants?.some(p => p.id === contactId) ?? false;
  }

  showPrivateConvForm = false;
  searchTerm = '';

  toggleNewPrivateConvForm() {
    this.showPrivateConvForm = !this.showPrivateConvForm;
    this.searchTerm = '';
  }

  filteredFriends(): User[] {
    return this.friends.filter(f =>
      `${f.firstName} ${f.lastName}`.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  showAddMembersModal = false;

  openAddMembersModal() {
    this.searchTerm = '';
    this.showAddMembersModal = true;
    this.friends = this.friends.map(f => ({
      ...f,
      selected: false // utile pour lier le checkbox
    }));
  }

  closeAddMembersModal() {
    this.showAddMembersModal = false;
  }


}

