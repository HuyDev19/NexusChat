# NexusChat - Project Specification

**Document Generated**: August 09, 2026
**Version**: 1.3.0
**Status**: Active Development

---

## 1. Project Overview

NexusChat is a web-based messaging application for social communication. The current implementation focuses on a chat MVP with authentication, friend requests, direct conversations, group conversations, conversation history, and real-time Video/Audio calls (1:1 and Group).

### Main goals
- Allow users to sign up and sign in securely.
- Support friendship management through friend requests.
- Enable direct and group messaging.
- Show conversations and message history in a chat UI.
- Keep authentication state in the frontend using Zustand stores.
- Provide premium, real-time Video & Audio calling (both 1:1 and Group) using LiveKit SFU and Socket.IO signaling.

---

## 2. Current Tech Stack

### Backend
| Technology | Version / Note | Purpose |
|---|---|---|
| Node.js | via Express runtime | Backend runtime |
| Express.js | ^5.1.0 | Web server and routing |
| MongoDB | via Mongoose | Database |
| Mongoose | ^8.19.0 | ODM for MongoDB |
| JWT | jsonwebtoken ^9.0.2 | Access token generation |
| bcrypt | ^6.0.0 | Password hashing |
| cookie-parser | ^1.4.7 | Parse refresh-token cookies |
| cors | ^2.8.5 | Cross-origin request handling |
| dotenv | ^17.2.3 | Environment variables |
| nodemon | ^3.1.10 | Development auto-reload |
| livekit-server-sdk | ^2.17.0 | Server token generation for LiveKit SFU |
| cloudinary | ^2.0.0 | Image hosting for avatars |
| multer | ^1.4.5 | File upload middleware |

### Frontend
| Technology | Version / Note | Purpose |
|---|---|---|
| React | ^19.2.0 | UI library |
| TypeScript | ~5.9.3 | Static typing |
| Vite | ^7.2.4 | Build tool and dev server |
| React Router | ^7.10.1 / ^7.13.2 | Client-side routing |
| Zustand | ^5.0.9 | State management |
| Axios | ^1.13.2 | API client |
| Tailwind CSS | ^4.1.17 | Styling |
| React Hook Form | ^7.68.0 | Form handling |
| Zod | ^4.1.13 | Form validation |
| Radix UI | various | UI primitives |
| lucide-react | ^0.555.0 | Icons |
| sonner | ^2.0.7 | Toast notifications |
| clsx / tailwind-merge | ^2.1.1 / ^3.4.0 | Utility class handling |
| livekit-client | ^2.28.1 | WebRTC Media & SFU client |
| @livekit/components-react | ^2.6.9 | LiveKit official React UI component set |
| @livekit/components-styles | ^1.0.16 | LiveKit prebuilt styles |

### Root workspace
- framer-motion ^12.38.0
- tailwind-scrollbar ^4.0.2

---

## 3. Architecture

The project is organized as a monorepo with two main parts:

- Backend: Node.js + Express API
- Frontend: React + TypeScript SPA

### Request flow
1. User signs in or signs up from the frontend.
2. The frontend stores the access token in Zustand and sends it in the Authorization header.
3. The backend verifies the token through auth middleware.
4. Protected endpoints handle users, friends, messages, and conversations.
5. Data is persisted in MongoDB through Mongoose models.

### Real-time & Calling Architecture
1. **Socket.IO Real-time Connection**:
   - Built for signaling events (ringing, invite, accept, decline, end).
   - Backend automatically assigns socket connections to a personal room (`user:${userId}`) using parsed JWT credentials from auth handshake.
2. **SFU WebRTC Engine (LiveKit)**:
   - When a call begins or is accepted, the backend generates an Access Token using `livekit-server-sdk`.
   - The frontend connects to the LiveKit Server via `livekit-client` using the token, handling video/audio stream subscription and publishing automatically.

### Current frontend routing
- /signin
- /signup
- / (protected, main chat UI)

### Current backend protection model
- The server applies auth middleware globally to private routes using app.use(protectedRoute).
- Public routes are mounted under /api/auth.

---

## 4. Current Folder Structure

### Root
- package.json
- backend/
- frontend/

### Backend structure
- backend/src/server.js
- backend/src/controllers/
   - authController.js
   - userController.js
   - friendController.js
   - messageController.js
   - conversationController.js
   - callController.js
- backend/src/models/
   - User.js
   - Conversation.js
   - Message.js
   - Friend.js
   - FriendRequest.js
   - Session.js
- backend/src/routes/
   - authRoute.js
   - userRoute.js
   - friendRoute.js
   - messageRoute.js
   - conversationRoute.js
   - callRoute.js
- backend/src/middlewares/
   - authMiddleware.js
   - friendMiddleware.js
- backend/src/libs/db.js
- backend/src/libs/callSocket.js
- backend/src/utils/messageHelper.js

### Frontend structure
- frontend/src/App.tsx
- frontend/src/pages/
   - SignInPage.tsx
   - SignUpPage.tsx
   - ChatAppPage.tsx
- frontend/src/components/
   - auth/
   - chat/
   - friendRequest/
   - newGroupChat/
   - profile/
   - sidebar/
   - skeleton/
   - ui/
   - call/
      - IncomingCallModal.tsx
      - CallRoomModal.tsx
- frontend/src/services/
   - authService.ts
   - chatService.ts
   - friendService.ts
   - userService.ts
   - callService.ts
- frontend/src/stores/
   - useAuthStore.ts
   - useChatStore.ts
   - useFriendStore.ts
   - useSocketStore.ts
   - useThemeStore.ts
   - useUserStore.ts
   - useCallStore.ts
- frontend/src/types/
   - chat.ts
   - store.ts
   - user.ts
- frontend/src/lib/
   - axios.ts
   - utils.ts

---

## 5. Implemented Features

### Authentication
- User sign up
- User sign in
- JWT access token issuance
- Refresh token stored in HttpOnly cookie
- Sign out and clear refresh-token session
- Protected route access through auth middleware

### User management
- Get current authenticated user via /api/users/me
- Basic user profile fields such as username, displayName, avatarUrl, email, bio, phone
- Update user profile information
- Upload and manage user avatar via Cloudinary
- Mini Profile Sidebar to quickly view a friend's details
- Real-time user presence tracking (online, offline, busy)

### Friend management
- Send friend requests
- Accept or decline requests
- View sent and received requests
- List friends

### Messaging
- Send direct messages
- Send group messages
- Create direct or group conversations
- Fetch conversation list
- Fetch messages with pagination
- Track unread counts and last message metadata per conversation
- **Real-time synchronization**: Instant message delivery and conversation list updates via Socket.IO

### Real-Time Video/Audio Call (1:1 and Group)
- **Call Launchers**: Integrated in `ChatWindowHeader.tsx` (Voice Call & Video Call buttons).
- **Ringing System**: Emits `call:invite` and triggers a clean visual `<IncomingCallModal />` with pulse animations and Mixkit Ringtone audio on loop for target users.
- **Web Push/Browser Notification**: Automatically pops up browser alerts when a call starts, directing the user back to the webapp on click.
- **Messenger-Style Call Room**: Prebuilt grid via LiveKit SDK inside `<CallRoomModal />` with Mute, Video Toggle, and Screen Share controls. 
- **Floating Panel Control**: Users can minimize the call layout to a small draggable panel in the corner to continue chatting.

---

## 6. Current API Surface

### Base URL
- Development: http://localhost:5002/api

### Public routes
- POST /api/auth/signup
- POST /api/auth/signin
- POST /api/auth/signout
- POST /api/auth/refresh

### Protected routes
- GET /api/users/me
- PUT /api/users/me
- GET /api/users/search
- GET /api/users/:id
- POST /api/users/uploadAvatar
- POST /api/friends/requests
- POST /api/friends/requests/:requestId/accept
- POST /api/friends/requests/:requestId/decline
- GET /api/friends
- GET /api/friends/requests
- POST /api/messages/direct
- POST /api/messages/group
- POST /api/conversations
- GET /api/conversations
- GET /api/conversations/:conversationId/messages
- POST /api/calls/token (Requests token and room details for LiveKit call room)

---

## 7. Data Models

### User
- username
- hashedPassword
- email
- displayName
- avatarUrl
- avatarId
- bio
- phone
- presenceStatus

### Conversation
- type: direct | group
- participants
- group.name / group.createdBy
- lastMessageAt
- seenBy
- lastMessage
- unreadCounts

### Message
- conversationId
- senderId
- content
- imgUrl
- timestamps

### Friend
- userA
- userB

### FriendRequest
- from
- to
- message

### Session
- userId
- refreshToken
- expiresAt

---

## 8. Frontend State Structure

The frontend uses several Zustand stores:
- useAuthStore: authentication state, sign in/out, session refresh
- useChatStore: conversations, messages, active conversation, chat actions
- useFriendStore: friend list and friend request operations
- useSocketStore: client-side socket connection logic, triggers call listeners dynamically
- useThemeStore: theme state
- useUserStore: user-specific actions
- useCallStore: active call state, incoming call state, starts and finishes call session
- useProfileStore: mini profile sidebar state and data

---

## 9. Current Gaps and Known Issues

### Backend / API
- Pagination bug in conversationController.js uses createAt instead of createdAt.
- The frontend calls a mark-as-seen endpoint, but the backend does not currently expose that route.

### Product scope
- No unfriend action yet.
- No group member management after creation.
- No message editing or deletion flow.

---

## 10. Summary

NexusChat is a fully functional web-based messaging app with instant chat capability and high-quality Messenger-style real-time audio and video call features, integrated via Socket.IO and LiveKit SFU.

---

## 11. Agent Development Rules (Critical)

### 11.1 Core rules
- Do not change the meaning of existing API contracts unless the change is explicitly requested.
- Preserve existing authentication flow.
- Ensure all socket handshakes decrypt token to set `socket.data.userId` properly. Do not bypass the personal `user:${userId}` room logic.
- Avoid replacing or refactoring LiveKit room setups. Prefer extension.

### 11.2 Call Flows Signaling Contract
The signaling events should respect the following rules:
- `call:invite` -> sends invitation to user rooms.
- `call:accept` -> signals to caller the call is accepted.
- `call:decline` -> signals rejection.
- `call:end` -> cleans up rooms.

### 11.3 Warning list
- Do not remove fallback JWT decode on socket connection in `server.js`.
- Do not bypass autoplay restrictions without warning. Ensure first-click user interactions are preserved.
