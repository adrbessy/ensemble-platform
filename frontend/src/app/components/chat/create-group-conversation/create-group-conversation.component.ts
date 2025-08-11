import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { ChatService } from '../../../services/chat.service';
import { UserService } from '../../../services/user.service';
import { ConversationDTO } from 'src/app/models/chat.models';

@Component({
  selector: 'app-create-group-conversation',
  templateUrl: './create-group-conversation.component.html',
  styleUrls: ['./create-group-conversation.component.css']
})
export class CreateGroupConversationComponent implements OnInit {
  groupName = '';
  selectedUserIds: number[] = [];
  contacts: any[] = [];
  currentUserId!: number;

  @Output() groupCreated = new EventEmitter<ConversationDTO>(); // ⬅ payload
  @Output() cancel = new EventEmitter<void>();

  constructor(private chatService: ChatService, private userService: UserService) {}

  ngOnInit(): void {
    this.userService.getContacts().subscribe({
      next: (users) => this.contacts = users,
      error: () => alert("Erreur lors du chargement des contacts")
    });
    this.userService.getCurrentUser().subscribe({
      next: (user) => {
        this.currentUserId = user.id;
      },
      error: () => alert("Erreur lors de la récupération de l'utilisateur")
    });
  }

  createGroupConversation() {
    if (!this.groupName || this.selectedUserIds.length < 2) {
      alert("Veuillez fournir un nom et au moins 2 membres.");
      return;
    }

    const allUserIds = [...this.selectedUserIds];
    if (!allUserIds.includes(this.currentUserId)) allUserIds.push(this.currentUserId);

    this.chatService.createGroupConversation({
      name: this.groupName,
      userIds: allUserIds
    }).subscribe({
      next: (conv: ConversationDTO) => {
        alert("Groupe créé !");
        this.groupCreated.emit(conv);           // ⬅️ send it up
      },
      error: () => alert("Erreur lors de la création du groupe.")
    });
  }

  onCancel() {
    this.cancel.emit();
  }


}

