# Comprehensive App Documentation: DailyTask

This document serves as a complete, start-to-finish guide on how the DailyTask application was built. It covers the entire architecture, technologies used, and step-by-step implementation details for future reference.

---

## 1. Technology Stack
- **Framework**: React Native with [Expo](https://expo.dev/) (SDK 50+)
- **Routing**: [Expo Router](https://docs.expo.dev/router/introduction/) (File-based routing)
- **Styling**: [NativeWind v4](https://www.nativewind.dev/) (Tailwind CSS for React Native)
- **State Management**: [Zustand](https://docs.pmnd.rs/zustand/getting-started/introduction) + AsyncStorage (for offline persistence)
- **Forms & Validation**: `react-hook-form` + `zod`
- **Animations & Gestures**: `react-native-reanimated` + `react-native-gesture-handler`
- **Hardware Integrations**: `expo-haptics` (for physical device feedback)

---

## 2. Project Architecture

The project follows a modular, feature-first folder structure:

```text
/app               # Expo Router pages (Screens)
  _layout.tsx      # Root layout, Stack Navigator, and Auth Guard
  index.tsx        # Home Screen (Task List)
  add.tsx          # Create Task Screen
  settings.tsx     # Preferences & Danger Zone
  login.tsx        # Authentication Screens
/components
  /ui              # Reusable generic components (Button, Input, Card)
  /task            # Domain-specific components (TaskCard, TaskForm)
/store             # Zustand state management
  taskStore.ts     # CRUD operations for tasks
  settingsStore.ts # Theme and notification preferences
  authStore.ts     # User authentication state
/types             # TypeScript interfaces and Zod schemas
```

---

## 3. State Management (Zustand)

Instead of passing props deeply or using complex Redux setups, we used **Zustand**. 

### Persistence
Every store (`taskStore`, `settingsStore`, `authStore`) is wrapped in Zustand's `persist` middleware combined with `@react-native-async-storage/async-storage`. This means if the user forcibly closes the app, all their tasks, theme preferences, and login state remain perfectly intact upon reopening.

```typescript
export const useTaskStore = create<TaskState>()(
  persist(
    (set) => ({ ...actions }),
    { name: 'task-storage', storage: createJSONStorage(() => AsyncStorage) }
  )
);
```

---

## 4. Styling and Dark Mode (NativeWind)

We used NativeWind v4, which allows us to write raw Tailwind CSS classes directly into the `className` prop of React Native components.

### Implementing Dark Mode
1. **State**: The `settingsStore` holds a `theme` value (`'light'` or `'dark'`).
2. **Engine Sync**: In `_layout.tsx`, we imported `useColorScheme` from NativeWind. We set up an effect to push our Zustand theme into the NativeWind engine: `setColorScheme(theme)`.
3. **Variants**: Across the entire app, we used Tailwind's `dark:` variant to handle the automatic color swapping:
   ```tsx
   <View className="bg-white dark:bg-gray-800">
     <Text className="text-gray-900 dark:text-white">Hello World</Text>
   </View>
   ```

---

## 5. Forms and Validation (Zod)

To ensure data integrity (like forcing passwords to be 6+ characters, or ensuring tasks have titles), we combined `zod` with `react-hook-form`.

1. **Schemas**: Defined in `types/auth.ts` and `types/task.ts`.
2. **Controllers**: In components like `TaskForm.tsx` and `login.tsx`, we wrapped our custom `<Input />` components inside React Hook Form's `<Controller />`.
3. **Error Handling**: If a user submits invalid data, the Controller automatically pulls the error message from Zod and displays it under the input field in red text.

---

## 6. Animations and Gestures

To make the app feel truly native and premium, we integrated heavy animation libraries.

1. **Reanimated Layouts**: In `TaskCard.tsx`, the card is wrapped in an `<Animated.View>`. When a task is added, it uses `entering={FadeInDown.springify()}` to bounce smoothly onto the screen. When deleted, it uses `exiting={FadeOutUp}`.
2. **Swipe to Delete**: We wrapped the Task Card in a `<Swipeable>` component from `react-native-gesture-handler`. Swiping left reveals a red trash-can button to delete the task. **Crucial setup step**: This required wrapping the entire `<Stack>` in `_layout.tsx` with a `<GestureHandlerRootView>`.

---

## 7. Authentication and Route Guarding

We implemented a complete simulated authentication flow (Login, Forgot Password, Reset Password).

### The Auth Guard
In `app/_layout.tsx`, we created a custom hook called `useProtectedRoute()`. 
- Every time a user changes screens, the hook checks `segments` (the current URL route) and the `isLoggedIn` state from `authStore`.
- If a user tries to access `/` (Home) while not logged in, `router.replace('/login')` instantly boots them out.
- If a logged-in user tries to access `/login`, they are instantly pushed back to `/`.

---

## 8. Premium Polish (Haptics & Icons)

1. **Expo Haptics**: Attached physical vibrations to major actions. When a user completes a task or successfully logs in, `Haptics.notificationAsync` fires to provide tactile feedback.
2. **Expo Vector Icons**: Replaced generic text emojis with high-quality SVG icons from `@expo/vector-icons` (e.g., `<Ionicons name="settings-outline" />`).

> [!TIP]
> **Metro Bundler Caching**: When installing packages that include custom `.ttf` fonts (like vector icons), the Expo Metro bundler often crashes with a `Cannot resolve...` error. The standard fix is to completely kill the terminal (`Ctrl+C`) and restart it using the cache-clear flag: `npx expo start -c`.

---

## 9. Command Line Reference

Below is a complete list of all the terminal commands used to initialize, build, and run this project.

### Project Initialization
Create a new Expo project using the default template:
```bash
npx create-expo-app@latest Dailytask
cd Dailytask
```

### Installing Core Dependencies
Install NativeWind v4 and its peer dependencies for styling:
```bash
npm install nativewind@^4.0.1 react-native-reanimated tailwindcss@^3.4.0
```

Install State Management (Zustand & AsyncStorage):
```bash
npm install zustand @react-native-async-storage/async-storage
```

Install Form Validation (React Hook Form & Zod):
```bash
npm install react-hook-form zod @hookform/resolvers
```

Install UI/UX Enhancements (Gestures, Haptics, Icons, Lists):
```bash
npx expo install react-native-gesture-handler
npx expo install expo-haptics
npx expo install @expo/vector-icons
npx expo install @shopify/flash-list
```

### Running the Application
To start the Expo development server:
```bash
npx expo start
```

To start the server with a tunnel (useful for testing on physical devices across networks):
```bash
npx expo start --tunnel
```

To forcefully clear the Metro bundler cache and restart (crucial after installing native modules or fonts):
```bash
npx expo start -c --tunnel
```

### Expo CLI Terminal Shortcuts
While the Metro bundler is running in the terminal, you can press the following keys to trigger actions:
- `r` - Reload the app on your connected device or emulator.
- `j` - Open the React Native debugger.
- `m` - Toggle the developer menu on your device.
- `o` - Open the app in the browser (for web builds).
- `c` - Show the QR code again.
- `Ctrl + C` - Stop the server.

---

## 10. Previewing with Expo Go

To test and preview your application on a physical device without configuring Xcode or Android Studio:

1. **Download the App**: Install the **Expo Go** app from the [Apple App Store](https://apps.apple.com/us/app/expo-go/id982107779) (iOS) or the [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent) (Android).
2. **Start the Server**: Run `npx expo start --tunnel` in your terminal.
3. **Scan the Code**:
   - **On iOS**: Open the native Camera app and point it at the QR code displayed in your terminal. Tap the yellow "Open in Expo Go" notification that appears.
   - **On Android**: Open the Expo Go app and tap "Scan QR Code", then point it at the terminal.
4. **Live Reloading**: Once connected, any code changes you save in your editor will instantly reflect on your phone!

---

## 11. Future Roadmap & Production Infrastructure Checklist

As the application moves past the initial phase, the following architectural improvements, production infrastructure requirements, and feature phases should be prioritized:

### Web Storage Enhancement (IndexedDB)
*   **Long-Term Strategy**: Currently, the web fallback layer utilizes `AsyncStorage`. For large datasets and advanced query filtering, migrating the web storage layer to **IndexedDB** is recommended to provide higher storage capacity, index-based querying, and better transactional performance.

### Production Infrastructure Requirements
*   **Decoupled Architecture & Event Bus**: Avoid direct module-to-module dependencies. Implement an **Event Bus** to dispatch app events (e.g. `Task Created`). Subscribing services (Analytics, Crash Reporting, Notifications, Widgets) can listen to these events asynchronously.
*   **Logging & Crash Reporting**: Build a unified `Logger` service that forwards console logs to future remote crash reporting APIs (like Sentry or Bugsnag).
*   **Transaction Integrity**: Refactor task mutation actions into atomic database transactions (e.g., `Create Task` -> `Insert Task` -> `Insert Subtasks` -> `Insert Tags` -> `Commit`) with rollback on any failure.
*   **Database Version Management**: Implement a structured Database Version Manager to handle incremental migrations (Version 1 -> Version 2 -> Version 3) when upgrading schemas without user data loss.
*   **Automated Testing Suite**: Establish unit and integration tests across all layers:
    *   *Repository Tests* (SQLite vs Web Mock storage)
    *   *Service Tests* (Business logic & transaction boundaries)
    *   *Store Tests* (Zustand state mutations)
    *   *Component Tests* (UI rendering and user interactions)

### Feature Implementation Phases
1.  **Phase 2.1 – Calendar Module**
    *   Month, Week, and Daily agenda views.
    *   Drag-and-drop rescheduling support.
2.  **Phase 2.2 – Dashboard & Analytics**
    *   Breakdown of Today's, Upcoming, Overdue, and Completed Today tasks.
    *   Productivity Score calculation.
3.  **Phase 2.3 – Focus Mode**
    *   One task at a time view.
    *   Integrated Pomodoro timer and progress tracking.
4.  **Phase 3 – Notifications & Reminders**
    *   Due date and early reminders.
    *   Daily planning push notifications.
    *   Action buttons (Complete, Snooze) directly from notification cards.
5.  **Phase 4 – Advanced Analytics**
    *   Completion trends, streaks, and category distributions.

### Long-Term Vision: Personal Productivity Platform
The application's modular design allows it to grow beyond simple task management into a complete productivity ecosystem:
```text
Core Platform
├── Tasks
├── Habits
├── Goals
├── Notes
├── Calendar
├── Reminders
├── Focus Sessions
├── Journal
├── AI Assistant
├── Analytics
├── Widgets
├── Cloud Sync
├── Team Collaboration
└── Automation Rules
```
