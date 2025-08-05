import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateGroupConversationComponent } from './create-group-conversation.component';

describe('CreateGroupConversationComponent', () => {
  let component: CreateGroupConversationComponent;
  let fixture: ComponentFixture<CreateGroupConversationComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CreateGroupConversationComponent]
    });
    fixture = TestBed.createComponent(CreateGroupConversationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
