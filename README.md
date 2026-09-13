<div align="center">
  <img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/message-square-dashed.svg" alt="NexusChat Logo" width="100"/>
  <h1>💬 NexusChat</h1>
  <p><strong>A modern, feature-rich web messaging application built for seamless social communication.</strong></p>
  
  <p>
    <img src="https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react" alt="React" />
    <img src="https://img.shields.io/badge/Node.js-Express-green?style=flat-square&logo=nodedotjs" alt="Node.js" />
    <img src="https://img.shields.io/badge/TypeScript-Ready-blue?style=flat-square&logo=typescript" alt="TypeScript" />
    <img src="https://img.shields.io/badge/LiveKit-WebRTC-red?style=flat-square" alt="LiveKit" />
    <img src="https://img.shields.io/badge/Socket.IO-Realtime-black?style=flat-square&logo=socketdotio" alt="Socket.IO" />
  </p>
</div>

---

**NexusChat** provides a highly responsive chat interface, secure authentication, real-time Video/Audio calls (1:1 and Group), AI integrations, and much more.

## ✨ Key Features

### 🚀 Core Chat Experience
- **Real-time Messaging**: Instant message delivery powered by Socket.IO.
- **Direct & Group Chats**: Create 1:1 conversations or manage large group chats with role-based permissions (Admin, Deputy, Member).
- **Public Channels**: Broadcast messages to followers in public or private channels.
- **Rich Media & Attachments**: Share images, videos, audio messages, and files (Google Drive integration).
- **Advanced Message Actions**:
  - Edit, recall, and pin messages.
  - Delete for me (local wipe).
  - React to messages with emojis.
  - Schedule messages for the future.
- **Markdown & Rich Text**: Support for bold, italics, lists, and code blocks.
- **Polls**: Create and vote on polls in group chats.

### 📞 Real-Time Audio & Video Calls (Messenger-style)
- **High-Quality Calls**: Powered by **LiveKit SFU** for low-latency 1:1 and Group video/audio calls.
- **AI Noise Cancellation**: Integrated **Krisp** for two-way background noise filtering.
- **Screen Sharing**: Easily share your screen with participants.
- **Device Controls**: Adjust camera, microphone, and speaker settings in real-time.
- **Picture-in-Picture (PiP)**: Minimize the call to a floating panel to continue chatting.
- **Web Push Notifications**: Automatic browser alerts for incoming calls.

### 🤖 AI Integrations (@NexusAI)
- **Smart Chatbot**: Call `@NexusAI` in any chat to ask questions or get assistance (Powered by Google Gemini API).
- **Conversation Summarization**: Quickly catch up on long chats with AI-generated summaries of the latest messages.
- **Speech-to-Text**: Real-time transcription for voice messages.
- **In-app Translation**: Translate messages on the fly using Google Translate API.

### 🔒 Privacy & Security
- **Incognito Mode (Chat Ẩn Danh)**: Secure, temporary 1:1 chats where messages expire and are wiped upon exiting.
- **Disappearing Messages**: Set timers for messages to self-destruct (5 mins, 1 hour, 24 hours).
- **View Once Media**: Send images or voice notes that disappear after being viewed.
- **Chat Lock**: Protect sensitive conversations with a 4-digit PIN.
- **Block/Unblock Users**: Manage your communication boundaries effectively.

### 🎨 Personalization & Social
- **Stories**: Share 24-hour expiring status updates with friends.
- **Customization**: Set custom chat wallpapers and shared nicknames per conversation.
- **Mini Profiles**: Quickly view a friend's details via a sidebar.
- **Offline Sync**: Graceful handling of network disconnects with an offline banner and sync store.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19, TypeScript, Vite
- **State Management**: Zustand
- **Styling**: Tailwind CSS, Radix UI, Framer Motion
- **WebRTC**: LiveKit Client, @livekit/components-react
- **Other**: React Hook Form, Zod, Axios, Socket.IO Client

### Backend
- **Runtime**: Node.js, Express.js
- **Database**: MongoDB, Mongoose
- **Real-time**: Socket.IO
- **WebRTC**: LiveKit Server SDK
- **AI & Integrations**: `@google/genai`, Vercel AI SDK, Cloudinary, Nodemailer
- **Authentication**: JWT, bcrypt

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB
- LiveKit Server (Cloud or Self-hosted)
- Cloudinary Account (for image hosting)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/HuyDev19/NexusChat.git
   cd NexusChat
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   ```
   Create a `.env` file in the `backend` directory and configure your environment variables (MongoDB URI, JWT Secret, LiveKit API keys, Cloudinary credentials, Gemini API key, etc.).
   
   Start the backend server:
   ```bash
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   cd ../frontend
   npm install
   ```
   Create a `.env` file in the `frontend` directory and add your frontend environment variables.
   
   Start the frontend server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173` (or the port specified by Vite).

---

## 👥 Development Team

- **Huỳnh Nhất Huy** (Leader) - Architecture, Auth, Real-time & AI
- **Đoàn Phan Vĩnh Phú** - UI & User Experience
- **Lê Nguyễn Nhật Duy** - API, Database & Integrations

---

*This project is built as a software engineering capstone project (Đồ án thực tế CNPM — DH GTVT TP.HCM 2026).*
