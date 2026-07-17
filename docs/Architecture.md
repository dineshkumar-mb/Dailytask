# Architecture

This document describes the high-level architecture of the Daily Tasks app.

## Tech Stack
- **Framework**: React Native + Expo
- **Routing**: Expo Router
- **Styling**: NativeWind (Tailwind CSS)
- **State Management**: Zustand
- **Data Fetching/Caching**: TanStack Query
- **Forms**: React Hook Form + Zod
- **Storage**: AsyncStorage
- **Animations**: Reanimated & Gesture Handler

## Core Principles
- Modular component design (dumb components in UI, smart components in Task).
- Strict typing with TypeScript.
- Separation of concerns between UI, State (store), and side effects (services).
