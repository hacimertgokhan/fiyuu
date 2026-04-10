# Real-Time Chat Guide

Build a WebSocket-based chat system with rooms and presence.

## Basic Setup

```typescript
// app/services/chat.service.ts
import { defineService } from "@fiyuu/runtime";
import { realtime } from "@fiyuu/realtime";
import { db } from "@fiyuu/db";

export default defineService({
  name: "chat",
  
  start() {
    const chat = realtime.channel("chat", {
      async canConnect(request) {
        const token = new URL(request.url).searchParams.get("token");
        const user = await verifyToken(token);
        return { allowed: !!user, user };
      },
    });
    
    // Join room
    chat.on("join", (data, socket) => {
      const { roomId } = data;
      socket.join(roomId);
      
      // Notify others
      chat.to(roomId).emit("user-joined", {
        user: socket.user,
        timestamp: Date.now(),
      });
    });
    
    // Send message
    chat.on("message", async (data, socket) => {
      const { roomId, text } = data;
      
      const message = {
        id: crypto.randomUUID(),
        roomId,
        userId: socket.user.id,
        userName: socket.user.name,
        text,
        createdAt: new Date().toISOString(),
      };
      
      // Save to database
      await db.table("messages").insert(message);
      
      // Broadcast to room
      chat.to(roomId).emit("message", message);
    });
    
    // Typing indicator
    chat.on("typing", (data, socket) => {
      chat.to(data.roomId).emit("typing", {
        user: socket.user,
        isTyping: data.isTyping,
      });
    });
    
    // Disconnect
    chat.on("disconnect", (socket) => {
      // Clean up logic
    });
  },
});
```

## Client-Side Usage

```html
<!-- In your page.tsx -->
<script>
  const ws = new WebSocket('ws://localhost:4051/chat?token=' + getToken());
  
  ws.onopen = () => {
    // Join a room
    ws.send(JSON.stringify({
      event: 'join',
      data: { roomId: 'general' }
    }));
  };
  
  ws.onmessage = (event) => {
    const { event: type, data } = JSON.parse(event.data);
    
    switch(type) {
      case 'message':
        appendMessage(data);
        break;
      case 'user-joined':
        showNotification(`${data.user.name} joined`);
        break;
      case 'typing':
        showTypingIndicator(data.user);
        break;
    }
  };
  
  // Send message
  function sendMessage(text) {
    ws.send(JSON.stringify({
      event: 'message',
      data: { roomId: 'general', text }
    }));
  }
  
  // Typing indicator
  let typingTimeout;
  input.addEventListener('input', () => {
    ws.send(JSON.stringify({
      event: 'typing',
      data: { roomId: 'general', isTyping: true }
    }));
    
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      ws.send(JSON.stringify({
        event: 'typing',
        data: { roomId: 'general', isTyping: false }
      }));
    }, 1000);
  });
</script>
```

## Private Messages

```typescript
// Private message between users
chat.on("private", async (data, socket) => {
  const { toUserId, text } = data;
  
  const message = {
    id: crypto.randomUUID(),
    fromUserId: socket.user.id,
    toUserId,
    text,
    createdAt: new Date().toISOString(),
  };
  
  await db.table("private_messages").insert(message);
  
  // Send to recipient if online
  chat.to(`user:${toUserId}`).emit("private", {
    ...message,
    fromUser: socket.user,
  });
  
  // Confirm to sender
  socket.emit("private-sent", { id: message.id });
});

// Join personal room on connect
chat.on("connect", (socket) => {
  socket.join(`user:${socket.user.id}`);
});
```

## Presence Tracking

```typescript
// Track online users
chat.on("join", async (data, socket) => {
  const { roomId } = data;
  
  socket.join(roomId);
  socket.setPresence({
    userId: socket.user.id,
    name: socket.user.name,
    room: roomId,
    joinedAt: Date.now(),
  });
  
  // Get online users
  const online = await chat.presence(roomId);
  
  // Send to joining user
  socket.emit("online-users", online);
  
  // Notify others
  chat.to(roomId).emit("user-joined", {
    user: socket.user,
    onlineCount: online.length,
  });
});

// On disconnect
chat.on("disconnect", (socket) => {
  const presence = socket.getPresence();
  if (presence?.room) {
    chat.to(presence.room).emit("user-left", {
      user: socket.user,
    });
  }
});
```

## Complete Chat Page

```typescript
// app/chat/page.tsx
import { Component } from "@geajs/core";
import { html } from "@fiyuu/core/client";

export default class ChatPage extends Component {
  template() {
    return html`
      <div id="chat-app">
        <div id="messages"></div>
        <div id="typing-indicator"></div>
        <input type="text" id="message-input" placeholder="Type a message..." />
        <button onclick="sendMessage()">Send</button>
      </div>
      
      <script>
        const ws = new WebSocket('ws://localhost:4051/chat?token=' + localStorage.getItem('token'));
        const messagesDiv = document.getElementById('messages');
        const input = document.getElementById('message-input');
        
        ws.onmessage = (event) => {
          const { event: type, data } = JSON.parse(event.data);
          
          if (type === 'message') {
            const div = document.createElement('div');
            div.innerHTML = '<strong>' + data.userName + ':</strong> ' + data.text;
            messagesDiv.appendChild(div);
          }
        };
        
        function sendMessage() {
          const text = input.value;
          if (!text) return;
          
          ws.send(JSON.stringify({
            event: 'message',
            data: { roomId: 'general', text }
          }));
          
          input.value = '';
        }
      </script>
    `;
  }
}
```
