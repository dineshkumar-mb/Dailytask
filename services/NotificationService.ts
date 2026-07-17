/**
 * NotificationService — TypeScript entry point.
 *
 * This file exists purely for TypeScript type-checking (tsc).
 * At runtime, Metro replaces it with:
 *   - NotificationService.native.ts  → on iOS / Android
 *   - NotificationService.web.ts     → on web
 *
 * We re-export from the web stub because it has the same API surface
 * with no native dependencies, making tsc happy on all platforms.
 */
export { NotificationService, setNotificationHandler } from './NotificationService.web';
export type { PermissionStatus } from './NotificationService.web';
