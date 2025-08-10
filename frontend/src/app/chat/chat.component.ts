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

  updateLastMessageTimestamp(conv: any, timestamp: string) {
    conv.lastMessageTimestamp = this.chatService['toMillis']
      ? (this.chatService as any).toMillis(timestamp) // si private, duplique une petite util ici
      : new Date(this.chatService.normalizeIso(timestamp)).getTime();
  }

  loadConversations() {
      // 🛡️ Protection si currentUserId pas encore initialisé
    if (!this.currentUserId) {
      console.warn("⏳ currentUserId pas encore défini, report du chargement des conversations.");
      return;
    }
    this.chatService.getConversations().subscribe({
      next: (convos) => {
        // 🧹 on repart de zéro pour les pastilles
        this.chatService.resetUnread();

        const loadMessagesPromises = convos.map(conv =>
          this.chatService.getMessagesByConversation(conv.id).toPromise().then(messages => ({
            ...conv,
            messages: messages ?? [],
          }))
        );

        Promise.all(loadMessagesPromises).then(convsWithMessages => {
          this.conversations = convsWithMessages.map(conv => {
            const lastMsg = conv.messages.at(-1);
            const lastSenderId = this.getSenderId(lastMsg);

            let isUnread = false;

            if (lastMsg) {
              console.log('DEBUG read/local',
                conv.id,
                'lastMsg=', lastMsg?.timestamp,
                'lastRead=', this.chatService['localReadMap'].get(conv.id)
              );

              const alreadyRead = this.chatService.wasReadLocally(conv.id, lastMsg.timestamp);
              console.log(
                'UNREAD CHECK',
                { convId: conv.id,
                  lastMsg: this.chatService.normalizeIso(lastMsg.timestamp),
                  lastRead: this.chatService['localReadMap'].get(conv.id),
                  alreadyRead
                }
              );

              if (lastSenderId === this.currentUserId || alreadyRead) {
                // ✅ soit c'est moi qui ai envoyé, soit j'ai déjà lu → pas de pastille
                this.chatService.clearUnreadForConversation(conv.id);
                isUnread = false;
              } else {
                // 🔴 nouveau non lu
                isUnread = true;
                this.chatService.notifyUnreadForConversation(conv.id);
              }
            }

            return {
              id: conv.id,
              name: conv.type === 'GROUP'
                ? conv.name
                : this.getOtherParticipantName(conv.participants),
              photoFilename: conv.type === 'GROUP'
                ? null
                : this.getOtherParticipantPhoto(conv.participants),
              type: conv.type,
              messages: conv.messages,
              participants: conv.participants,
              lastMessage: lastMsg?.content ?? '',
              lastMessageTimestamp: lastMsg
                ? (this.chatService as any).toMillis(lastMsg.timestamp)   // ou une util publique
                : 0,
              unread: isUnread // 🔁 utile pour l'affichage direct
            };
          });

          // 🧩 Log de vérification
          console.log("🧩 Conversations après mapping :");
          console.table(this.conversations.map(c => ({
            id: c.id,
            lastMessage: c.lastMessage,
            lastMessageTimestamp: c.lastMessageTimestamp,
          })));

          // 🔃 Trie les conversations par date
          this.conversations.sort((a, b) => {
            return (b.lastMessageTimestamp ?? 0) - (a.lastMessageTimestamp ?? 0);
          });

        });
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
  hasUnreadMessages: boolean = false;


  ngOnInit(): void {
    this.userService.getCurrentUser().subscribe({
      next: (user) => {
        this.currentUserId = user.id;

        // 🧠 1. Précharge les statuts de lecture depuis le backend
        this.chatService.getAllReadStatuses().subscribe(statusMap => {
          for (const [convId, ts] of Object.entries(statusMap)) {
            this.chatService.markAsReadLocally(+convId, ts);
          }

          // 📨 2. Charge les conversations après avoir récupéré les statuts de lecture
          this.loadConversations();
        });

        // 👥 3. Charge les contacts (amis)
        this.loadContacts();

        // 🔔 4. Abonnement aux nouveaux messages (WebSocket)
        this.chatService.onMessageReceived().subscribe((message: any) => {
          console.log('📥 Nouveau message WebSocket reçu :', message);
          const conv = this.conversations.find(c => c.id === message.conversationId);
          console.log('conv :', conv);

          if (conv) {
            conv.messages.push(message);
            this.updateLastMessageTimestamp(conv, message.timestamp);
            conv.lastMessage = message.content;
            this.bumpConversationToTop(conv);

            // 🆕 Force la mise à jour Angular
            this.conversations = [...this.conversations];

            if (this.selectedConv?.id !== conv.id) {
              conv.unread = true;
              this.chatService.notifyUnreadForConversation(conv.id);
              this.hasUnreadMessages = this.conversations.some(c => c.unread);
            } else {
              conv.unread = false;
              this.chatService.clearUnreadForConversation(conv.id);
              this.chatService.markAsReadLocally(conv.id, message.timestamp); // ✅ MAJ côté local
              this.chatService.markAsReadOnServer(conv.id, message.timestamp).subscribe();
              this.hasUnreadMessages = this.conversations.some(c => c.unread);
              this.scrollToBottom();
              this.cdr.detectChanges();
            }
          } else {
            this.loadConversations(); // au cas où la conv n'est pas encore chargée
          }
        });
      },
      error: (err) => {
        console.error('❌ Erreur lors de la récupération de l\'utilisateur courant', err);
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
    conv.unread = false;
    this.hasUnreadMessages = this.conversations.some(c => c.unread);
    this.selectedConv = conv;

    // ✅ Supprime les notifications visuelles
    this.chatService.clearUnreadForConversation(conv.id);
    console.log("✅ Conversation lue :", conv.id);

    const markAsReadEverywhere = (timestamp: string) => {
      this.chatService.markAsReadLocally(conv.id, timestamp);
      this.chatService.markAsReadOnServer(conv.id, timestamp).subscribe();
    };

    if (!conv.messages || conv.messages.length === 0) {
      // 🔄 Charge les messages si non présents
      this.chatService.getMessagesByConversation(conv.id).subscribe({
        next: (msgs) => {
          console.log("📩 Messages récupérés :", msgs);
          conv.messages = msgs;

          if (msgs.length > 0) {
            const lastMsg = msgs.at(-1);
            if (lastMsg && this.getSenderId(lastMsg) !== this.currentUserId) {
              markAsReadEverywhere(this.chatService.normalizeIso(lastMsg.timestamp));
            }
          }

          this.cdr.detectChanges();  // force l'update de la vue
        },
        error: (err) => {
          console.error("Erreur lors du chargement des messages", err);
        }
      });
    } else {
      // ✅ Messages déjà présents → on lit le dernier
      const lastMsg = conv.messages.at(-1);
      if (lastMsg && this.getSenderId(lastMsg) !== this.currentUserId) {
       markAsReadEverywhere(this.chatService.normalizeIso(lastMsg.timestamp));
      }
    }
  }

  /** Upsert + bump + tri + refresh */
  private upsertAndBump(convId: number, lastMsg: any, convPatch?: Partial<any>) {
    // 1) trouver ou créer la conversation
    let idx = this.conversations.findIndex(c => c.id === convId);
    if (idx === -1) {
      const base = {
        id: convId,
        name: '',
        type: 'PRIVATE',
        photoFilename: null,
        participants: [],
        messages: [],
        lastMessage: '',
        lastMessageTimestamp: 0,
        unread: false,
        ...convPatch,                // permet d’injecter name/participants si tu les as
      };
      this.conversations.unshift(base);
      idx = 0;
    }

    const conv = this.conversations[idx];

    // 2) mettre à jour le dernier message
    conv.messages = conv.messages ?? [];
    if (lastMsg) conv.messages.push(lastMsg);

    const iso = this.chatService.normalizeIso(lastMsg.timestamp);
    conv.lastMessage = lastMsg.content ?? conv.lastMessage ?? '';
    conv.lastMessageTimestamp = Date.parse(iso);

    // 3) remonter et trier
    this.conversations.splice(idx, 1);
    this.conversations.unshift(conv);
    this.conversations.sort((a, b) => (b.lastMessageTimestamp ?? 0) - (a.lastMessageTimestamp ?? 0));

    // 4) forcer la détection (utile en change detection default)
    this.conversations = [...this.conversations];
  }

  sendMessage() {
    if (!this.newMessage.trim() || !this.selectedConv) return;
    this.chatService.sendMessageToConversation(this.selectedConv.id, this.newMessage.trim()).subscribe({
      next: () => {
        const newMsg = {
          senderId: this.currentUserId,
          sender: { id: this.currentUserId },
          content: this.newMessage.trim(),
          timestamp: this.chatService.normalizeIso(new Date().toISOString())
        };

        this.upsertAndBump(this.selectedConv.id, newMsg);

        // ✅ Marquer comme lu tout de suite
        this.chatService.markAsReadLocally(this.selectedConv.id, newMsg.timestamp);
        this.chatService.markAsReadOnServer(this.selectedConv.id, newMsg.timestamp).subscribe();

        console.log('✉️ Message envoyé - conv mise à jour :', this.selectedConv);

        // 🆕 Force la mise à jour de la vue
        this.conversations = [...this.conversations];
        this.newMessage = '';
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

    // ✅ Met à jour la timestamp si manquante (optionnel si tu le fais déjà ailleurs)
    if (!conv.lastMessageTimestamp && conv.messages?.length) {
      const lastMsg = conv.messages.at(-1);
      if (lastMsg) {
        conv.lastMessageTimestamp = new Date(lastMsg.timestamp).getTime();
      }
    }

    // ✅ Trie toutes les conversations
    this.conversations.sort((a, b) => {
      return (b.lastMessageTimestamp ?? 0) - (a.lastMessageTimestamp ?? 0);
    });
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

  userColors: { [key: number]: string } = {};

  getColorForUser(userId: number): string {
    if (!this.userColors[userId]) {
      // génère une couleur basée sur l'ID
      const colors = ['#e74c3c', '#3498db', '#2ecc71', '#9b59b6', '#e67e22', '#1abc9c'];
      this.userColors[userId] = colors[userId % colors.length];
    }
    return this.userColors[userId];
  }


  formatTimestamp(ts: string) { 
    return new Date(ts).toISOString(); // conserve .mmmZ
  }

  private getSenderId(msg: any): number | null {
    return msg?.senderId ?? msg?.sender?.id ?? null;
  }


}

