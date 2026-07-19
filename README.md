# DailyTask 🚀

**DailyTask** is a modern, offline-first personal productivity platform built with **React Native**, **Expo SDK 57**, **Drizzle ORM**, **Zustand**, and **NativeWind (Tailwind CSS)**. It features an intelligent **AI Assistant Platform** powered by Google Gemini with local vector search, automated task planning, habit tracking, interactive calendar views, focus timer (Pomodoro), and local notifications.

---

## 📸 Key Highlights & Features

- 📝 **Task Management**:
  - Full CRUD operations with priorities (`Low`, `Medium`, `High`, `Urgent`), categories, and tags.
  - Subtask tracking, due dates, reminder dates, estimated vs. actual minutes, and recurrence rules (daily, weekly, etc.).
  - Soft-deletion with Trash management and Archiving functionality.
- 🤖 **AI Productivity Assistant**:
  - Integrated **Gemini AI Engine** with local vector embeddings (`text-embedding-004`) and RAG (Retrieval-Augmented Generation).
  - Autonomous Action Executor with tool calling to create, update, complete, or schedule tasks via natural language commands.
  - Long-term memory store (`ai_memories`) and semantic caching (`semantic_cache`) to optimize responses.
- ⏱️ **Focus Mode (Pomodoro Timer)**:
  - Customizable focus and break durations with haptic feedback.
  - Session history logging directly into SQLite database.
- 📅 **Calendar & Schedule View**:
  - Interactive daily, weekly, and monthly agenda views built using `react-native-calendars`.
- 🔁 **Habit Tracking**:
  - Daily habit check-ins and streak management.
- 🔔 **Smart Local Notifications**:
  - Native notification scheduling for task reminders, daily planning prompts, and focus timer alerts.
- 🌙 **Dark Mode & Styling**:
  - Adaptive light/dark theme powered by **NativeWind v4** and Zustand store persistence.
  - Smooth animations using **React Native Reanimated** and haptic feedback via `expo-haptics`.
- 💾 **Offline-First & Local Storage**:
  - Relational database schema with **Drizzle ORM** over **Expo SQLite**.
  - Secondary offline persistence via `AsyncStorage` + Zustand middleware.
  - Local credentials secured with `expo-secure-store`.

---

## 🛠️ Technology Stack

| Domain | Technology |
| :--- | :--- |
| **Framework** | [React Native](https://reactnative.dev/) (v0.86) & [Expo SDK 57](https://expo.dev/) |
| **Routing** | [Expo Router v57](https://docs.expo.dev/router/introduction/) (File-based navigation) |
| **Database & ORM** | [Expo SQLite v57](https://docs.expo.dev/versions/v57.0.0/sdk/sqlite/) & [Drizzle ORM](https://orm.drizzle.team/) |
| **State Management** | [Zustand v5](https://zustand-demo.pmnd.rs/) with `persist` & `AsyncStorage` |
| **Styling** | [NativeWind v4](https://www.nativewind.dev/) (Tailwind CSS 3.4) |
| **Forms & Validation**| [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/) |
| **Animations & UI** | [React Native Reanimated v4](https://docs.swmansion.com/react-native-reanimated/), [FlashList](https://shopify.github.io/flash-list/) |
| **AI Integration** | Google Gemini API, custom local VectorStore & SemanticCache |
| **Hardware / Native** | `expo-haptics`, `expo-notifications`, `expo-secure-store` |

---

## 📁 Project Architecture

```text
d:\Dailytask
├── app/                        # Expo Router Navigation & Pages
│   ├── (tabs)/                 # Main Bottom Tab Navigation
│   │   ├── index.tsx           # Home Screen (Task Feed & Quick Actions)
│   │   ├── calendar.tsx        # Calendar & Schedule View
│   │   ├── focus.tsx           # Focus Timer (Pomodoro)
│   │   ├── habits.tsx          # Habit Tracker
│   │   └── settings.tsx       # User Preferences, Theme & AI Settings
│   ├── add.tsx                 # Task Creation Modal
│   ├── edit/                   # Task Edit Screens
│   ├── focus/                  # Full-screen Focus Session View
│   ├── archived.tsx            # Archived Tasks Management
│   ├── trash.tsx               # Trash & Soft-deleted Task Recovery
│   ├── login.tsx               # Authentication Screen
│   ├── signup.tsx              # Sign Up Screen
│   └── _layout.tsx             # Root Layout & Protected Route Guard
├── components/                 # UI Components
│   ├── ui/                     # Basic Atomic Components (Button, Input, Card)
│   ├── task/                   # Task Cards, Task Forms, Filtering
│   ├── focus/                  # Focus Timer UI & Controls
│   ├── dashboard/              # Analytics & Summary Widgets
│   └── settings/               # Setting Toggles & AI Config Forms
├── db/                         # Database Configuration & Schema
│   ├── schema.ts               # Drizzle SQLite Schema (Tasks, Subtasks, AI Memories, etc.)
│   └── client.ts               # SQLite Client Instance
├── services/                   # Business Services & Domain Logic
│   ├── ai/                     # Gemini AI Platform (Agent, Memory, VectorStore, Tools)
│   ├── TaskService.ts          # Core Task Business Operations
│   ├── NotificationService.ts  # Native & Web Notification Handlers
│   ├── FocusService.ts         # Pomodoro Session Controller
│   ├── DashboardService.ts     # Productivity Metrics Calculation
│   └── EventBus.ts             # Application Event Dispatcher
├── repositories/               # Data Layer Repositories
├── store/                      # Zustand State Stores (tasks, settings, auth, focus, calendar)
├── types/                      # TypeScript Interfaces and Zod Schemas
├── tests/                      # Testing Framework and Infrastructure Verification
└── docs/                       # Architectural & Technical Documentation
```

---

## 🗄️ Database Schema Overview

The SQLite database managed by **Drizzle ORM** contains the following tables:

- **`tasks`**: Primary task attributes (title, status, priority, estimated/actual minutes, due dates, sync flags).
- **`subtasks`**: Nested subtasks with completion status.
- **`categories` & `tags`**: Classification models and junction table `task_tags`.
- **`attachments`**: Media attachment references (images, audio, PDFs).
- **`focus_sessions`**: Recorded Pomodoro focus blocks and break periods.
- **`notifications`**: Scheduled local push notification queue.
- **`task_embeddings`**: Vector embeddings for semantic search over tasks.
- **`ai_memories`**: Long-term user preference and task context memory store.
- **`semantic_cache`**: Cached LLM responses to reduce latency and API consumption.

---

## ⚡ Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Expo Go](https://expo.dev/go) app on your iOS/Android device (or an emulator/simulator)

### 1. Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/dineshkumar-mb/Dailytask.git
cd Dailytask
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the project root to configure optional parameters or default API keys:

```env
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
```

*(Note: You can also enter and save your Gemini API Key directly inside the app's **Settings** screen, stored securely via `expo-secure-store`).*

### 3. Start Development Server

Run Expo CLI to launch the development server:

```bash
npx expo start
```

Press the key corresponding to your target environment:
- `a` — Open in Android Emulator / Device
- `i` — Open in iOS Simulator
- `w` — Open in Web Browser

---

## 📜 Available Scripts

In the project directory, you can run:

| Command | Description |
| :--- | :--- |
| `npm start` / `npx expo start` | Starts the Expo dev server |
| `npm run android` | Starts Expo dev server targeting Android |
| `npm run ios` | Starts Expo dev server targeting iOS |
| `npm run web` | Starts Expo dev server targeting Web |
| `npm run typecheck` | Runs TypeScript type checking (`tsc --noEmit`) |
| `npm run lint` | Runs Expo ESLint check |
| `npm run test:infra` | Runs the headless infrastructure test suite |
| `npm run reset-project` | Resets project starter files |

---

## 🧠 AI Assistant & Platform Architecture

DailyTask includes an embedded AI engine that acts as an intelligent productivity companion:

1. **RAG Context Retrieval**: Uses local vector search over task embeddings and long-term memories to build contextually rich prompts.
2. **Autonomous Tool Execution**: The AI agent can invoke tools (`create_task`, `complete_task`, `search_tasks`, `query_memories`) to automatically modify your workspace upon command.
3. **Semantic Caching**: Common queries are cached locally using embedding similarity to improve response speed and optimize API key usage.

---

## 🧪 Testing

The repository includes a custom test setup designed to run headless infrastructure and service-layer validation tests without requiring a full React Native native runtime context:

```bash
npm run test:infra
```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
