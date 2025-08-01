import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit {
  conversations = [
    {
      id: 1,
      name: 'Alice',
      lastMessage: 'À demain !',
      messages: [
        { senderId: 1, content: 'Salut !', timestamp: new Date() },
        { senderId: 2, content: 'Hello 👋', timestamp: new Date() }
      ]
    }
  ];
  selectedConv: any = null;
  newMessage = '';
  currentUserId = 1;

  ngOnInit(): void {
    this.selectedConv = this.conversations[0];
  }

  selectConversation(conv: any) {
    this.selectedConv = conv;
  }

  sendMessage() {
    if (!this.newMessage.trim()) return;

    this.selectedConv.messages.push({
      senderId: this.currentUserId,
      content: this.newMessage.trim(),
      timestamp: new Date()
    });

    this.newMessage = '';
    // scroll à la fin automatique possible ici
  }
}

