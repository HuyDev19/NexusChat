# NexusChat - Project Specification

**Document Generated**: July 25, 2026
**Version**: 1.1.0
**Status**: Active Development

---

## 1. Project Overview

NexusChat is a web-based messaging application for social communication. The current implementation focuses on a chat MVP with authentication, friend requests, direct conversations, group conversations, and conversation history.

### Main goals
- Allow users to sign up and sign in securely.
- Support friendship management through friend requests.
- Enable direct and group messaging.
- Show conversations and message history in a chat UI.
- Keep authentication state in the frontend using Zustand stores.

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
- backend/src/middlewares/
  - authMiddleware.js
  - friendMiddleware.js
- backend/src/libs/db.js
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
- frontend/src/services/
  - authService.ts
  - chatService.ts
  - friendService.ts
  - userService.ts
- frontend/src/stores/
  - useAuthStore.ts
  - useChatStore.ts
  - useFriendStore.ts
  - useSocketStore.ts
  - useThemeStore.ts
  - useUserStore.ts
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
- Basic user profile fields such as username, displayName, avatarUrl, email

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

### Frontend experience
- Protected routes for signed-in users
- Sidebar-based chat layout
- Friend request dialogs and modals
- Toast notifications via sonner
- Zustand-based global state

---

## 6. Current API Surface

### Base URL
- Development: http://localhost:5001/api

### Public routes
- POST /api/auth/signup
- POST /api/auth/signin
- POST /api/auth/signout
- POST /api/auth/refresh

### Protected routes
- GET /api/users/me
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

### Notes
- The frontend uses Axios with a shared instance in frontend/src/lib/axios.ts.
- The client also injects the access token automatically into requests.
- The frontend has a refresh-token flow that retries failed requests on 403 responses.

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
- useSocketStore: client-side socket connection logic
- useThemeStore: theme state
- useUserStore: user-specific actions

---

## 9. Current Gaps and Known Issues

### Backend / API
- Pagination bug in conversationController.js uses createAt instead of createdAt.
- The frontend calls a mark-as-seen endpoint, but the backend does not currently expose that route.
- Some frontend services call endpoints such as /users/search, but the backend does not yet implement that route.
- No explicit rate limiting or input sanitization is currently added.

### Frontend / UX
- Some UI features are present in components but may be incomplete or not wired fully to the backend.
- The socket integration is present in the frontend store, but the backend does not currently expose a real-time socket server in this repo.
- Image upload is not implemented end-to-end.

### Product scope
- No unfriend action yet.
- No group member management after creation.
- No message editing or deletion flow.
- No online/offline presence system beyond client-side socket setup.

---

## 10. Summary

NexusChat is currently a functional chat MVP with authentication, friendships, direct/group messaging, and conversation history. The codebase is organized into clear backend and frontend layers, and the main remaining work is around reliability, real-time support, and a few missing features.

---

## 11. Agent Development Rules (Critical)

This section is intended for coding agents and contributors. When implementing new features or fixing bugs, preserve the existing project logic and avoid breaking current behaviors.

### 11.1 Core rules
- Do not change the meaning of existing API contracts unless the change is explicitly requested.
- Preserve existing authentication flow: access token in Authorization header, refresh token in HttpOnly cookie.
- Preserve the current backend route structure under /api/auth, /api/users, /api/friends, /api/messages, and /api/conversations.
- Preserve the current frontend state model: Zustand stores should remain the main source of state for auth, chat, friends, and socket integration.
- Avoid rewriting core logic in a way that changes business rules such as friendship validation, group membership validation, unread count behavior, or conversation creation rules.
- When adding new features, prefer extension over replacement.

### 11.2 Must-not-break functions and flows
The following functions and flows are part of the current project contract and should be treated as high sensitivity:

#### Backend
- authController.signUp
- authController.signIn
- authController.signOut
- authController.refreshToken
- protectedRoute in authMiddleware
- checkFriendship in friendMiddleware
- checkGroupMembership in friendMiddleware
- sendDirectMessage in messageController
- sendGroupMessage in messageController
- createConversation in conversationController
- getConversations in conversationController
- getMessages in conversationController
- updateConversationAfterCreateMessage in messageHelper

#### Frontend
- useAuthStore.signIn / signOut / refresh / fetchMe
- useChatStore.fetchConversations / fetchMessages / sendDirectMessage / sendGroupMessage / createConversation / markAsSeen
- useFriendStore.addFriend / getAllFriendRequests / acceptRequest / declineRequest / getFriends
- useSocketStore.connectSocket / disconnectSocket
- authService, chatService, friendService
- axios interceptor logic for token injection and refresh retry

### 11.3 Safe modification guidelines
- If a bug fix is needed, keep the input/output shape unchanged unless the change is explicitly approved.
- Preserve request body fields such as recipientId, memberIds, conversationId, content, to, message.
- Preserve response field names where possible, especially for existing frontend consumers.
- Do not remove or rename store actions without updating all dependent components.
- If adding new routes, keep them additive and avoid replacing existing endpoints.
- If fixing a backend issue, prefer small targeted changes over large refactors.

### 11.4 Recommended implementation approach
1. Understand the current logic before editing.
2. Identify whether the change is additive, corrective, or refactoring.
3. Keep backward compatibility whenever possible.
4. Verify the change against the current flow before claiming completion.
5. If a change affects authentication, friendship, or conversation state, validate it carefully.

### 11.5 Warning list
- Do not change the default auth behavior to a different token strategy without approval.
- Do not bypass friendship checks for direct/group messaging.
- Do not change conversation creation rules in a way that creates invalid direct/group states.
- Do not alter the frontend store contract without updating the related services/components together.
- Do not remove existing toast/error handling patterns unless necessary and carefully reviewed.

### 11.6 Preferred change pattern
Prefer:
- adding a new optional field or endpoint,
- extending a controller with a small helper,
- adding a new store action rather than replacing an existing one,
- wrapping existing logic with a small guard instead of rewriting core flows.

Avoid:
- replacing the entire auth stack,
- rewriting chat state management from scratch,
- changing all API response formats at once,
- removing existing validation middleware.

---

## 12. Summary

The project should remain stable and predictable. Future changes should be additive and should not silently break the original messaging, authentication, friendship, and conversation logic.
