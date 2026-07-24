# NexusChat - Project Specification

**Document Generated**: April 7, 2026  
**Version**: 1.0.0 (Based on Current Codebase)  
**Status**: Active Development

---

## 📋 PROJECT OVERVIEW

**NexusChat** is a web-based real-time messaging application designed for social communication. It enables users to:

- Register and authenticate securely
- Build a friend network through friend requests
- Send and receive messages in direct conversations (1-on-1)
- Create and participate in group conversations
- Track unread messages and conversation history
- Manage user profiles with avatars and personal information

**Primary Use Case**: Social networking and instant messaging platform similar to Messenger or WhatsApp Web.

---

## 🛠️ TECH STACK

### Backend
| Technology | Version | Purpose |
|---|---|---|
| **Node.js** | (via Express) | Runtime environment |
| **Express.js** | ^5.1.0 | Web server framework |
| **MongoDB** | (Mongoose ^8.19.0) | Database (NoSQL) |
| **Mongoose** | ^8.19.0 | MongoDB ODM |
| **JWT (jsonwebtoken)** | ^9.0.2 | Authentication tokens |
| **bcrypt** | ^6.0.0 | Password hashing |
| **cookie-parser** | ^1.4.7 | Cookie parsing middleware |
| **CORS** | ^2.8.5 | Cross-origin resource sharing |
| **dotenv** | ^17.2.3 | Environment variables |
| **nodemon** | ^3.1.10 | Dev server auto-reload |

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| **React** | ^19.2.0 | UI framework |
| **TypeScript** | ~5.9.3 | Type safety |
| **Vite** | ^7.2.4 | Build tool & dev server |
| **React Router** | ^7.13.2 | Client-side routing |
| **React Router DOM** | ^7.13.2 | DOM-specific routing |
| **Zustand** | ^5.0.9 | State management |
| **Axios** | ^1.13.2 | HTTP client |
| **TailwindCSS** | ^4.1.17 | Utility-first CSS framework |
| **React Hook Form** | ^7.68.0 | Form state management |
| **Zod** | ^4.1.13 | Schema validation |
| **Radix UI** | Various | Unstyled UI components |
| **lucide-react** | ^0.555.0 | Icon library |
| **sonner** | ^2.0.7 | Toast notifications |
| **clsx** | ^2.1.1 | Conditional classnames |
| **tailwind-merge** | ^3.4.0 | Merge TailwindCSS classes |

---

## 🏗️ SYSTEM ARCHITECTURE

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React + TypeScript)            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Pages: SignIn, SignUp, ChatApp                       │   │
│  │ Components: Auth, UI, Layout                          │   │
│  │ State: Zustand (useAuthStore)                        │   │
│  │ HTTP: Axios with JWT interceptors                    │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────┬──────────────────────────────────────────┘
                   │
        HTTP/REST API (JSON)
        Cookies (refreshToken)
                   │
┌──────────────────▼──────────────────────────────────────────┐
│                Backend (Node.js + Express)                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Routes: Auth, Users, Friends, Messages, Conversations│   │
│  │ Controllers: Business logic layer                    │   │
│  │ Middlewares: Auth, Friend validation                 │   │
│  │ Models: Mongoose schemas for data                    │   │
│  │ Utils: Message helpers                               │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────┬──────────────────────────────────────────┘
                   │
        MongoDB Driver (Mongoose)
                   │
┌──────────────────▼──────────────────────────────────────────┐
│              MongoDB Database (NoSQL)                         │
│  Collections: users, conversations, messages, friends,       │
│              friendrequests, sessions                         │
└──────────────────────────────────────────────────────────────┘
```

### Authentication Flow

1. **Sign Up**: User provides credentials → bcrypt hash → User stored in DB
2. **Sign In**: Username lookup → bcrypt compare → JWT access token issued → Refresh token in HttpOnly cookie
3. **Protected Routes**: Access token in Authorization header → JWT verification → User attached to request
4. **Token Refresh**: Expired access token detected → Refresh token from cookie → New access token issued
5. **Sign Out**: Clear cookie → Delete session from DB

---

## 📁 FOLDER STRUCTURE

### Root Directory
```
d:/DH_GTVT_HCM/Lập_Trình_Web/NexusChat/
├── package.json                          (Root dependencies: framer-motion)
├── backend/                              (Node.js + Express server)
│   ├── package.json
│   ├── src/
│   │   ├── server.js                     (Entry point, middleware setup)
│   │   ├── controllers/
│   │   │   ├── authController.js         (signUp, signIn, signOut, refreshToken)
│   │   │   ├── userController.js         (authMe - get current user)
│   │   │   ├── friendController.js       (Friend requests & friend list)
│   │   │   ├── messageController.js      (Send direct & group messages)
│   │   │   └── conversationController.js (Create, get, & fetch messages)
│   │   ├── models/
│   │   │   ├── User.js                   (User schema)
│   │   │   ├── Conversation.js           (Conversation schema: direct & group)
│   │   │   ├── Message.js                (Message schema)
│   │   │   ├── Friend.js                 (Friend relationship)
│   │   │   ├── FriendRequest.js          (Friend request schema)
│   │   │   └── Session.js                (Refresh token session)
│   │   ├── routes/
│   │   │   ├── authRoute.js              (Auth endpoints)
│   │   │   ├── userRoute.js              (User endpoints)
│   │   │   ├── friendRoute.js            (Friend endpoints)
│   │   │   ├── messageRoute.js           (Message endpoints)
│   │   │   └── conversationRoute.js      (Conversation endpoints)
│   │   ├── middlewares/
│   │   │   ├── authMiddleware.js         (JWT verification)
│   │   │   └── friendMiddleware.js       (Friendship & group membership check)
│   │   ├── libs/
│   │   │   └── db.js                     (MongoDB connection)
│   │   └── utils/
│   │       └── messageHelper.js          (Update conversation after message)
│
└── frontend/                             (React + TypeScript app)
    ├── package.json
    ├── vite.config.ts
    ├── tsconfig.json
    ├── tailwind.config.ts
    ├── components.json                   (Shadcn/UI config for Radix UI)
    ├── index.html
    ├── src/
    │   ├── main.tsx                      (React entry point)
    │   ├── App.tsx                       (Routes, Toaster setup)
    │   ├── index.css
    │   ├── pages/
    │   │   ├── SignInPage.tsx            (Sign in page)
    │   │   ├── SignUpPage.tsx            (Sign up page)
    │   │   └── ChatAppPage.tsx           (Main chat interface)
    │   ├── components/
    │   │   ├── auth/
    │   │   │   ├── ProtectedRoute.tsx    (Route guard)
    │   │   │   ├── Logout.tsx            (Logout button)
    │   │   │   ├── signin-form.tsx        (Sign in form with validation)
    │   │   │   └── signup-form.tsx        (Sign up form with validation)
    │   │   ├── layout/                   (⚠️ Folder exists but empty)
    │   │   └── ui/                       (Radix UI shadcn components)
    │   │       ├── button.tsx
    │   │       ├── card.tsx
    │   │       ├── input.tsx
    │   │       ├── label.tsx
    │   │       ├── field.tsx
    │   │       └── separator.tsx
    │   ├── lib/
    │   │   ├── axios.ts                  (Axios instance with JWT interceptors)
    │   │   ├── utils.ts                  (Utility functions)
    │   │   └── mockApi.ts                (⚠️ Mock API - status unclear)
    │   ├── services/
    │   │   └── authService.ts            (API calls for auth endpoints)
    │   ├── stores/
    │   │   └── useAuthStore.ts           (Zustand auth state)
    │   ├── types/
    │   │   ├── store.ts                  (AuthState interface)
    │   │   └── user.ts                   (User interface)
    │   ├── assets/                       (Images, icons)
    │   └── styles/                       (Additional CSS)
    └── public/                           (Static files)
```

---

## 🔌 API ENDPOINTS

### Base URL
- **Development**: `http://localhost:5001/api`
- **Production**: Deployed URL + `/api`

### Authentication Routes (Public)
**Base**: `/api/auth`

#### POST `/api/auth/signup`
- **Purpose**: Register a new user
- **Authentication**: ❌ Not required
- **Request Body**:
  ```json
  {
    "username": "string",
    "password": "string",
    "email": "string",
    "firstName": "string",
    "lastName": "string"
  }
  ```
- **Response**: 204 No Content (success) or error
- **Validation**: All fields required; username must be unique

#### POST `/api/auth/signin`
- **Purpose**: Authenticate user and issue tokens
- **Authentication**: ❌ Not required
- **Request Body**:
  ```json
  {
    "username": "string",
    "password": "string"
  }
  ```
- **Response**: 200 OK
  ```json
  {
    "message": "User {displayName} đã logged in!",
    "accessToken": "string"
  }
  ```
- **Cookies Set**: `refreshToken` (httpOnly, secure, sameSite: 'none')
- **Token TTL**: 
  - Access: 30 minutes
  - Refresh: 14 days

#### POST `/api/auth/signout`
- **Purpose**: Logout user and invalidate tokens
- **Authentication**: ❌ Not required (but uses refreshToken cookie)
- **Request Body**: Empty
- **Response**: 204 No Content
- **Side Effects**: 
  - Deletes refresh token from Session collection
  - Clears refreshToken cookie

#### POST `/api/auth/refresh`
- **Purpose**: Generate new access token using refresh token
- **Authentication**: ❌ Not required (uses refreshToken cookie)
- **Request Body**: Empty
- **Response**: 200 OK
  ```json
  {
    "accessToken": "string"
  }
  ```
- **Error Cases**: 
  - 401 if no refresh token
  - 403 if token invalid or expired

---

### User Routes (Protected)
**Base**: `/api/users`  
**Authentication**: ✅ Required (Authorization: Bearer {accessToken})

#### GET `/api/users/me`
- **Purpose**: Get current authenticated user's profile
- **Response**: 200 OK
  ```json
  {
    "user": {
      "_id": "ObjectId",
      "username": "string",
      "email": "string",
      "displayName": "string",
      "avatarUrl": "string|null",
      "avatarId": "string|null",
      "bio": "string|null",
      "phone": "string|null",
      "createdAt": "ISO date",
      "updatedAt": "ISO date"
    }
  }
  ```

---

### Friend Routes (Protected)
**Base**: `/api/friends`  
**Authentication**: ✅ Required

#### POST `/api/friends/requests`
- **Purpose**: Send a friend request
- **Request Body**:
  ```json
  {
    "to": "ObjectId",
    "message": "optional string (max 300 chars)"
  }
  ```
- **Response**: 201 Created
  ```json
  {
    "message": "Gửi lời mời kết bạn thành công",
    "request": {
      "_id": "ObjectId",
      "from": "ObjectId",
      "to": "ObjectId",
      "message": "string|null",
      "createdAt": "ISO date",
      "updatedAt": "ISO date"
    }
  }
  ```
- **Validation**: 
  - Cannot send to self
  - User must exist
  - Cannot send if already friends
  - Only one pending request allowed

#### POST `/api/friends/requests/:requestId/accept`
- **Purpose**: Accept a friend request
- **Path Parameter**: `requestId` (FriendRequest ObjectId)
- **Response**: 200 OK
  ```json
  {
    "message": "Chấp nhận lời mời kết bạn thành công",
    "newFriend": {
      "_id": "ObjectId",
      "displayName": "string",
      "avatarUrl": "string|null"
    }
  }
  ```
- **Side Effects**: 
  - Creates Friend document
  - Deletes FriendRequest
- **Authorization**: Only request recipient can accept

#### POST `/api/friends/requests/:requestId/decline`
- **Purpose**: Decline a friend request
- **Path Parameter**: `requestId`
- **Response**: 204 No Content
- **Authorization**: Only request recipient can decline

#### GET `/api/friends`
- **Purpose**: Get list of all friends
- **Response**: 200 OK
  ```json
  {
    "friends": [
      {
        "_id": "ObjectId",
        "displayName": "string",
        "avatarUrl": "string|null"
      }
    ]
  }
  ```

#### GET `/api/friends/requests`
- **Purpose**: Get pending friend requests (sent and received)
- **Response**: 200 OK
  ```json
  {
    "sent": [
      {
        "_id": "ObjectId",
        "from": "ObjectId",
        "to": {
          "_id": "ObjectId",
          "username": "string",
          "displayName": "string",
          "avatarUrl": "string|null"
        },
        "message": "string|null",
        "createdAt": "ISO date"
      }
    ],
    "received": [
      {
        "_id": "ObjectId",
        "from": {
          "_id": "ObjectId",
          "username": "string",
          "displayName": "string",
          "avatarUrl": "string|null"
        },
        "to": "ObjectId",
        "message": "string|null",
        "createdAt": "ISO date"
      }
    ]
  }
  ```

---

### Message Routes (Protected)
**Base**: `/api/messages`  
**Authentication**: ✅ Required

#### POST `/api/messages/direct`
- **Purpose**: Send a message in a direct conversation
- **Middleware**: `checkFriendship` - Validates sender and recipient are friends
- **Request Body**:
  ```json
  {
    "recipientId": "ObjectId",
    "content": "string",
    "conversationId": "ObjectId (optional)"
  }
  ```
- **Response**: 201 Created
  ```json
  {
    "message": {
      "_id": "ObjectId",
      "conversationId": "ObjectId",
      "senderId": "ObjectId",
      "content": "string",
      "imgUrl": "string|null",
      "createdAt": "ISO date",
      "updatedAt": "ISO date"
    }
  }
  ```
- **Side Effects**: 
  - Creates/finds direct conversation if needed
  - Updates conversation's lastMessage and unreadCounts
- **Validation**: recipientId must be a friend

#### POST `/api/messages/group`
- **Purpose**: Send a message in a group conversation
- **Middleware**: `checkGroupMembership` - Validates user is group member
- **Request Body**:
  ```json
  {
    "conversationId": "ObjectId",
    "content": "string"
  }
  ```
- **Response**: 201 Created
  ```json
  {
    "message": {
      "_id": "ObjectId",
      "conversationId": "ObjectId",
      "senderId": "ObjectId",
      "content": "string",
      "imgUrl": "string|null",
      "createdAt": "ISO date",
      "updatedAt": "ISO date"
    }
  }
  ```
- **Side Effects**: Same as direct message

---

### Conversation Routes (Protected)
**Base**: `/api/conversations`  
**Authentication**: ✅ Required

#### POST `/api/conversations`
- **Purpose**: Create a new conversation (direct or group)
- **Middleware**: `checkFriendship` - For direct: validates friendship; for group: validates all members are friends
- **Request Body**:
  ```json
  {
    "type": "direct|group",
    "name": "string (required for group only)",
    "memberIds": ["ObjectId", "ObjectId", ...]
  }
  ```
- **Response**: 201 Created
  ```json
  {
    "conversation": {
      "_id": "ObjectId",
      "type": "direct|group",
      "participants": [
        {
          "_id": "ObjectId",
          "displayName": "string",
          "avatarUrl": "string|null",
          "joinedAt": "ISO date"
        }
      ],
      "group": {
        "name": "string",
        "createdBy": "ObjectId"
      },
      "lastMessageAt": "ISO date",
      "seenBy": ["ObjectId"],
      "lastMessage": {
        "_id": "ObjectId",
        "content": "string",
        "senderId": {
          "_id": "ObjectId",
          "displayName": "string",
          "avatarUrl": "string|null"
        },
        "createdAt": "ISO date"
      },
      "unreadCounts": {}
    }
  }
  ```
- **Validation**: 
  - For direct: memberIds[0] must be friend
  - For group: all memberIds must be friends, name required

#### GET `/api/conversations`
- **Purpose**: Get all conversations for the current user
- **Response**: 200 OK
  ```json
  {
    "conversations": [
      {
        "_id": "ObjectId",
        "type": "direct|group",
        "participants": [...],
        "lastMessage": {...},
        "unreadCounts": {
          "userId": 5,
          "userId2": 0
        }
      }
    ]
  }
  ```
- **Sorting**: By lastMessageAt (descending), then updatedAt (descending)

#### GET `/api/conversations/:conversationId/messages`
- **Purpose**: Get messages from a conversation with pagination
- **Query Parameters**:
  - `limit` (default: 50) - How many messages to fetch
  - `cursor` (optional) - ISO date string for pagination
- **Response**: 200 OK
  ```json
  {
    "messages": [
      {
        "_id": "ObjectId",
        "conversationId": "ObjectId",
        "senderId": "ObjectId",
        "content": "string",
        "imgUrl": "string|null",
        "createdAt": "ISO date",
        "updatedAt": "ISO date"
      }
    ],
    "nextCursor": "ISO date string|null"
  }
  ```
- **Pagination Logic**: 
  - Fetches `limit + 1` messages to determine if more exist
  - Returns `limit` messages and nextCursor for next page
  - Messages sorted by createdAt (newest first), then reversed for display
- **⚠️ Bug**: Uses `createAt` instead of `createdAt` in cursor query (line typo)

---

## 💾 DATABASE DESIGN

### MongoDB Collections & Schemas

#### 1. **User Collection**
```javascript
{
  username: String (unique, lowercase, required),
  hashedPassword: String (bcrypt, required),
  email: String (unique, lowercase, required),
  displayName: String (required),
  avatarUrl: String (CDN URL, optional),
  avatarId: String (Cloudinary public_id, optional),
  bio: String (max 500 chars, optional),
  phone: String (sparse - allows null but no duplicates, optional),
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```
**Indexes**:
- `username` (unique)
- `email` (unique)

**Relationships**:
- Referenced by: Conversation (participants), Message (senderId), Friend, FriendRequest, Session

---

#### 2. **Conversation Collection**
```javascript
{
  type: String (enum: ["direct", "group"], required),
  participants: [
    {
      userId: ObjectId (ref: User, required),
      joinedAt: Date (default: now),
      _id: false
    }
  ],
  group: {
    name: String (group name),
    createdBy: ObjectId (ref: User),
    _id: false
  },
  lastMessageAt: Date,
  seenBy: [ObjectId] (ref: User, array of user IDs who have seen last message),
  lastMessage: {
    _id: String (message ObjectId),
    content: String,
    senderId: ObjectId (ref: User),
    createdAt: Date,
    _id: false
  },
  unreadCounts: Map of String => Number (userId => count),
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```
**Indexes**:
- `participants.userId` - For finding user's conversations

**Type Variants**:
- **Direct**: Has 2 participants, no group data
- **Group**: Has 3+ participants, includes group name and creator

---

#### 3. **Message Collection**
```javascript
{
  conversationId: ObjectId (ref: Conversation, required, indexed),
  senderId: ObjectId (ref: User, required),
  content: String (optional - for text messages),
  imgUrl: String (optional - for media),
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```
**Indexes**:
- `conversationId` (single)
- `{ conversationId: 1, createdAt: -1 }` (compound for efficient querying)

**Constraint**: At least content OR imgUrl should be present (⚠️ not enforced schema-wise)

---

#### 4. **Friend Collection**
```javascript
{
  userA: ObjectId (ref: User, required),
  userB: ObjectId (ref: User, required),
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```
**Indexes**:
- `{ userA: 1, userB: 1 }` (unique, prevents duplicates)

**Pre-Save Hook**: Ensures `userA < userB` (lexicographically) to prevent duplicate relationships in opposite order

**Relationship**: Bidirectional - can query either userA or userB

---

#### 5. **FriendRequest Collection**
```javascript
{
  from: ObjectId (ref: User, required),
  to: ObjectId (ref: User, required),
  message: String (max 300 chars, optional),
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```
**Indexes**:
- `{ from: 1, to: 1 }` (unique, prevents duplicate requests)
- `{ from: 1 }` - For queries by sender
- `{ to: 1 }` - For queries by recipient

**Constraint**: Only one pending request allowed per pair at a time.

---

#### 6. **Session Collection**
```javascript
{
  userId: ObjectId (ref: User, required, indexed),
  refreshToken: String (unique, required),
  expiresAt: Date (required),
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```
**Indexes**:
- `userId` (single)
- `refreshToken` (unique)
- `{ expiresAt: 1 }` (TTL index, auto-deletes after expiration)

**TTL Behavior**: MongoDB automatically deletes expired sessions via TTL index.

---

## 🎯 CORE FEATURES

### 1. **User Authentication**
- ✅ Sign up with username, email, password, first/last name
- ✅ Sign in with username/password
- ✅ JWT-based access tokens (30 min lifetime)
- ✅ Refresh token rotation (14 day lifetime)
- ✅ Password hashing with bcrypt (salt: 10)
- ✅ HttpOnly secure cookies for refresh tokens
- ✅ Protected routes with middleware
- ✅ Automatic token refresh on 403 response

### 2. **User Profiles**
- ✅ Display name (auto-formatted from first + last name)
- ✅ Avatar URL (CDN-based)
- ✅ Avatar ID (for Cloudinary deletion)
- ✅ Bio (max 500 chars)
- ✅ Phone number (optional)
- ✅ Get current user profile via `/me` endpoint

### 3. **Friend Management**
- ✅ Send friend requests with optional message
- ✅ Accept/decline friend requests
- ✅ View pending sent and received requests
- ✅ Get list of all friends
- ✅ Friendship validation (bidirectional)
- ✅ Prevents duplicate requests/friendships
- ⚠️ No friend removal/unfriend feature currently

### 4. **Direct Messaging**
- ✅ Send text messages in direct conversations
- ✅ Auto-create direct conversation on first message
- ✅ Find existing direct conversation if available
- ✅ Can include optional image URL
- ✅ Requires friendship validation
- ✅ Track unread counts per user

### 5. **Group Messaging**
- ✅ Create group conversations
- ✅ Add multiple friends to groups
- ✅ Send messages in groups
- ✅ Track group creator
- ✅ Track member join dates
- ✅ Group name support
- ⚠️ No add/remove members after creation
- ⚠️ No group deletion feature

### 6. **Conversation Management**
- ✅ View all conversations for current user
- ✅ Sort by lastMessageAt and updatedAt
- ✅ Display last message preview
- ✅ Track unread count per participant
- ✅ View participant list with join dates
- ✅ Get all messages with pagination

### 7. **Message Pagination**
- ✅ Cursor-based pagination using createdAt timestamp
- ✅ Reverse chronological loading (newest first)
- ⚠️ Bug: Uses `createAt` instead of `createdAt` in cursor filter

---

## 🔄 DATA FLOW

### Flow: Send Direct Message

```
Frontend
   │
   ├─ User types message & clicks send
   ├─ formSubmit → sendMessage()
   │
   └──► axios.post("/api/messages/direct", {
          recipientId: "...",
          content: "...",
          conversationId: "..." (optional)
        })
        │
        (JWT in Authorization header)
        │
Backend
   │
   ├─ Express receives POST request
   │
   ├─ Route: /api/messages/direct
   │  │
   │  ├─ Middleware: authMiddleware
   │  │  └─ Verify JWT → Attach user to req
   │  │
   │  ├─ Middleware: checkFriendship
   │  │  └─ Query Friend collection
   │  │  └─ Validate recipientId is a friend
   │  │
   │  └─ Controller: sendDirectMessage()
   │     │
   │     ├─ If conversationId provided:
   │     │  └─ Conversation.findById(conversationId)
   │     │
   │     ├─ If no conversation exists:
   │     │  └─ Create new direct conversation
   │     │     └─ Participants: [senderId, recipientId]
   │     │
   │     ├─ Create Message document
   │     │  └─ Message.create({
   │     │       conversationId,
   │     │       senderId,
   │     │       content
   │     │     })
   │     │
   │     ├─ Update Conversation
   │     │  ├─ Set seenBy: []
   │     │  ├─ Set lastMessageAt
   │     │  ├─ Set lastMessage (reference)
   │     │  └─ Update unreadCounts:
   │     │     └─ senderId: 0 (sender has "seen" their own message)
   │     │     └─ recipientId: prevCount + 1
   │     │
   │     ├─ conversation.save()
   │     │
   │     └─ res.status(201).json({ message })
        │
Frontend
   │
   ├─ Receive message object
   ├─ Update UI (add message to chat)
   └─ Clear input field
```

### Flow: Pagination - Get Messages

```
Frontend
   │
   ├─ Component mounted or scroll to top detected
   ├─ hasNextCursor && !loading → Fetch more
   │
   └──► axios.get("/api/conversations/{conversationId}/messages", {
          params: { limit: 50, cursor: "2026-04-07T10:30:00Z" }
        })
        │
Backend
   │
   ├─ Route: /api/conversations/{conversationId}/messages
   │  │
   │  └─ Controller: getMessages()
   │     │
   │     ├─ Parse query params: limit, cursor
   │     │
   │     ├─ Build query:
   │     │  ├─ conversationId: {conversationId}
   │     │  └─ If cursor: createdAt < cursor ⚠️ BUG: createAt typo
   │     │
   │     ├─ Message.find(query)
   │     │  ├─ .sort({ createdAt: -1 })     (newest first)
   │     │  └─ .limit(limit + 1)            (fetch extra to detect more)
   │     │
   │     ├─ Response logic:
   │     │  ├─ If messages.length > limit:
   │     │  │  └─ nextCursor = messages[last]._id.toISOString()
   │     │  │  └─ messages.pop()  (remove extra)
   │     │  │
   │     │  ├─ messages.reverse()  (oldest to newest for display)
   │     │  │
   │     │  └─ Return { messages, nextCursor }
        │
Frontend
   │
   ├─ Receive messages array (oldest first)
   ├─ Receive nextCursor for future pagination
   └─ Append/prepend messages to message list
```

### Flow: Accept Friend Request

```
Frontend (Friends UI)
   │
   ├─ User clicks "Accept" on a friend request
   │
   └──► axios.post("/api/friends/requests/{requestId}/accept")
        │
Backend
   │
   ├─ Route: /api/friends/requests/{requestId}/accept
   │  │
   │  ├─ Middleware: authMiddleware (verify JWT)
   │  │
   │  └─ Controller: acceptFriendRequest()
   │     │
   │     ├─ FriendRequest.findById(requestId)
   │     │
   │     ├─ Verify current user is the 'to' user
   │     │  └─ Reject if not (403 Forbidden)
   │     │
   │     ├─ Create Friend document
   │     │  └─ Friend.create({
   │     │       userA: request.from,
   │     │       userB: request.to
   │     │     })
   │     │     (Pre-save hook ensures userA < userB)
   │     │
   │     ├─ FriendRequest.findByIdAndDelete(requestId)
   │     │
   │     ├─ User.findById(request.from).select(...)
   │     │  └─ Get sender's info for response
   │     │
   │     └─ res.status(200).json({ newFriend })
        │
Frontend
   │
   ├─ Receive newFriend object
   ├─ Add to friends list
   ├─ Remove from pending received requests
   └─ Show toast: "Friend request accepted"
```

---

## 📝 CODING CONVENTIONS

### Backend (Node.js/Express)

| Convention | Example | Notes |
|---|---|---|
| **File Structure** | `controllers/`, `models/`, `routes/`, `middlewares/` | Separation of concerns |
| **Naming** | `userController.js`, `authRoute.js` | Feature-based file names |
| **Export** | `export const functionName = async (req, res) => {}` | Named exports |
| **Error Handling** | Try/catch blocks, explicit status codes | Consistent error responses |
| **Status Codes** | 201 (create), 200 (ok), 400 (bad), 401 (auth), 403 (forbidden), 404 (not found), 500 (server error) | RESTful conventions |
| **Import Syntax** | `import X from "./path.js"` | ES6 modules (type: "module" in package.json) |
| **Async/Await** | Controllers use async/await for DB operations | No callback hell |
| **Validation** | Middleware-based (authMiddleware, friendMiddleware) | Pre-controller validation |
| **Response Format** | `{ message: "...", data: {...} }` or direct data | Consistent JSON structure |
| **Comments** | Vietnamese inline comments | Language: Vietnamese (in code) |

### Frontend (React/TypeScript)

| Convention | Example | Notes |
|---|---|---|
| **File Structure** | `components/`, `pages/`, `stores/`, `services/`, `types/` | Feature-based organization |
| **Naming** | `SignInPage.tsx`, `useAuthStore.ts`, `authService.ts` | Clear intent in name |
| **Components** | Function components with hooks | No class components |
| **Styling** | TailwindCSS className strings | Utility-first CSS |
| **State Management** | Zustand (useAuthStore) | Single source of truth for auth |
| **HTTP Client** | Axios with interceptors | JWT auto-injection, auto-refresh |
| **Forms** | React Hook Form + Zod validation | Type-safe, minimal re-renders |
| **Routing** | React Router v7 with protected routes | ProtectedRoute wrapper |
| **TypeScript** | Explicit interfaces in `types/` folder | Type safety throughout |
| **Error Handling** | Try/catch + toast notifications (sonner) | User-friendly error display |

### Shared Conventions

| Convention | Details |
|---|---|
| **Environment Variables** | `.env` file (not in repo), loaded by `dotenv` (backend) / `import.meta.env` (frontend) |
| **API Base Path** | `/api/` prefix for all routes |
| **Authentication Header** | `Authorization: Bearer {accessToken}` |
| **Cookies** | `refreshToken` (httpOnly, secure, sameSite: 'none') |
| **Timestamps** | ISO 8601 format from Mongoose |
| **ObjectIds** | MongoDB ObjectId (MongoDB native) |
| **Language** | Vietnamese error messages in backend; English in UI components |
| **Git** | Monorepo with backend/ and frontend/ as separate projects |

---

## ⚠️ RISKS & ISSUES

### Critical

1. **⚠️ Message Pagination Bug**
   - **File**: [backend/src/controllers/conversationController.js](backend/src/controllers/conversationController.js#L99)
   - **Issue**: Uses `createAt` instead of `createdAt` in cursor query
   - **Code**: `query.createAt = { $lt: new Date(cursor) };`
   - **Impact**: Pagination doesn't work; always fetches most recent messages
   - **Fix**: Change to `query.createdAt = ...`

2. **⚠️ Cross-Origin Issues**
   - **Issue**: CORS configured with `sameSite: 'none'` on cookies
   - **Details**: Backend CORS allows frontend origin only; frontend must be on different domain
   - **Risk**: If both deployed on same domain, cookies won't send
   - **Impact**: Refresh token functionality will break

### High Priority

3. **⚠️ No Input Validation on Message Content**
   - **File**: messageController.js, conversationController.js
   - **Issue**: Only checks if content exists, no length limits or sanitization
   - **Risk**: Large messages, XSS vulnerabilities (if content rendered without escaping)
   - **Recommendation**: Add schema validation, max length checks, content sanitization

4. **⚠️ Missing Image Upload/Validation**
   - **Fields**: Message.imgUrl, User.avatarUrl
   - **Issue**: URLs accepted as strings, no validation or upload handler
   - **Current**: Frontend forms don't have image upload UI
   - **Impact**: Feature incomplete; imgUrl field unused in practice

5. **⚠️ No Rate Limiting**
   - **Issue**: No rate limiting on auth or message endpoints
   - **Risk**: Brute force attacks, spam messages
   - **Recommendation**: Add rate limiting middleware (e.g., express-rate-limit)

6. **⚠️ Unread Counts Not Marked as Read**
   - **Issue**: unreadCounts incremented on new message, never decremented
   - **Impact**: Users can't mark conversations as read
   - **Missing Feature**: No endpoint to clear unread state

### Medium Priority

7. **⚠️ No Group Member Management**
   - **Missing**: Add/remove members from existing groups
   - **Missing**: Leave group functionality
   - **Current**: Can only be added at creation time

8. **⚠️ Friend Unfriend Feature Missing**
   - **Missing**: No endpoint to remove friendships
   - **Impact**: Friend list grows only

9. **⚠️ Type Mismatch in Frontend**
   - **File**: frontend/src/types/user.ts
   - **Issue**: Interface has `display` field, but backend returns `displayName`
   - **Impact**: Type checking will fail; potential runtime errors

10. **⚠️ No User Search/Discovery**
    - **Missing**: No endpoint to search for users
    - **Current**: Must know usernames to add friends
    - **Impact**: Can't discover new users to chat with

11. **⚠️ No Conversation Deletion**
    - **Missing**: Can't delete/archive conversations
    - **Impact**: Conversation list grows indefinitely

12. **⚠️ Empty Layout Folder**
    - **File**: frontend/src/components/layout/
    - **Issue**: Folder exists but is empty; possibly planned but unimplemented
    - **Status**: ⚠️ Unknown intent

13. **⚠️ Mock API File Unused**
    - **File**: frontend/src/lib/mockApi.ts
    - **Issue**: File exists but not imported/used
    - **Status**: Dead code or incomplete feature?

### Low Priority / Code Quality

14. **⚠️ TypeScript @ts-nocheck Comments**
    - **Usage**: authController.js, authMiddleware.js
    - **Issue**: Disables type checking for entire file
    - **Impact**: Consistency issues; not all files use this

15. **⚠️ No Logging Strategy**
    - **Current**: Console.error for debugging only
    - **Missing**: No structured logging, no log levels
    - **Recommendation**: Add logger library (winston, pino)

16. **⚠️ No Database Backup/Recovery Plan**
    - **Current**: MongoDB connection string from env variable
    - **Missing**: Backup strategy, disaster recovery plan
    - **Recommendation**: Document backup and recovery procedures

---

## 🔍 UNDEFINED / NEEDS CLARIFICATION

| Item | Status | Notes |
|---|---|---|
| Image upload system | ❓ Not implemented | Fields exist (imgUrl, avatarUrl) but no upload handler |
| Group member management | ❓ Not implemented | Can add at creation only |
| Message reactions/emoji | ❓ Not implemented | Not in schema |
| Typing indicators | ❓ Not implemented | Real-time feature missing |
| WebSocket/Real-time sync | ❓ Not implemented | Only RESTful API, no live updates |
| User online status | ❓ Not implemented | No timestamp or status field |
| Message editing/deletion | ❓ Not implemented | Not in schema or endpoints |
| Conversation threading | ❓ Not implemented | Flat message structure only |
| User blocking | ❓ Not implemented | No block list or related fields |
| Conversation pinning | ❓ Not implemented | No pin status in schema |
| Message search | ❓ Not implemented | No search endpoint |
| Email verification | ❓ Not implemented | Sign up accepts any email |
| Password reset | ❓ Not implemented | No recovery mechanism |
| Dark mode | ❓ Not implemented | UI exists but no theme toggle |
| Mock API purpose | ❓ Unknown | File exists but unused |
| Layout folder intent | ❓ Unknown | Folder empty; unclear purpose |

---

## 📊 SUMMARY

**NexusChat** is a **feature-complete messaging MVP** with:

✅ **Complete**:
- User authentication & profiles
- Friend request system
- Direct messaging
- Group messaging
- Conversation management
- Message pagination

❌ **Missing**:
- Real-time updates (WebSocket)
- Image uploads
- Group members management
- Message editing
- Unread status management
- User search

The codebase is **well-structured** with clear separation of concerns, but has **several bugs and missing features** that should be addressed before production use.

---

**Last Updated**: April 7, 2026  
**Next Review**: When major features are added or significant refactoring occurs
