// @ts-nocheck
// Intercept require BEFORE requiring the test suite to bypass React Native / Expo native module loading
import Module from 'module';

// Define minimal globals
(global as any).__DEV__ = true;
(global as any).ErrorUtils = {
  getGlobalHandler: () => () => {},
  setGlobalHandler: () => {}
};
const mockExpo = {
  EventEmitter: class {
    addListener() { return { remove: () => {} }; }
    removeAllListeners() {}
    emit() {}
  }
};
(globalThis as any).expo = mockExpo;
(global as any).expo = mockExpo;
(global as any).window = {
  location: { protocol: 'https:' },
  addEventListener: () => {}
};

const originalRequire = (Module.prototype as any).require;
(Module.prototype as any).require = function (id: string) {
  // Prune any Expo async require or hot module reloading code in testing
  if (id.includes('async-require') || id.includes('setupHMR') || id.includes('hmr')) {
    return {};
  }

  // 1. Mock store files to prune database/SQLite imports
  if (id.endsWith('store/taskStore') || id.endsWith('../store/taskStore')) {
    return {
      useTaskStore: Object.assign(() => [], {
        getState: () => ({
          tasks: [],
          addTask: async () => {},
          updateTask: async () => {},
          deleteTask: async () => {},
          toggleComplete: async () => {}
        }),
        subscribe: () => () => {}
      })
    };
  }
  if (id.endsWith('store/focusStore') || id.endsWith('../store/focusStore')) {
    return {
      useFocusStore: Object.assign(() => [], {
        getState: () => ({}),
        subscribe: () => () => {}
      })
    };
  }
  if (id.endsWith('store/settingsStore') || id.endsWith('../store/settingsStore')) {
    return {
      useSettingsStore: Object.assign(() => [], {
        getState: () => ({
          geminiApiKey: undefined
        }),
        subscribe: () => () => {}
      })
    };
  }

  // 2. Mock native SQLite / Drizzle to prevent filesystem access crashes
  if (id === 'expo-sqlite' || id === 'expo-sqlite/next') {
    return {
      openDatabaseSync: () => ({
        execSync: () => {},
        prepareSync: () => ({ executeSync: () => ({}) })
      })
    };
  }
  if (id.startsWith('drizzle-orm') && id !== 'drizzle-orm/sqlite-core') {
    const mockSql = Object.assign(() => ({}), { raw: () => ({}) });
    return {
      drizzle: () => ({}),
      sql: mockSql
    };
  }
  if (id === 'drizzle-orm/sqlite-core') {
    const chain = () => ({
      primaryKey: chain,
      notNull: chain,
      default: chain,
      references: chain,
      $defaultFn: chain
    });
    return {
      sqliteTable: () => ({}),
      text: chain,
      integer: chain,
      real: chain,
      blob: chain
    };
  }

  // 3. Mock native libraries that might still be required
  if (id === 'react-native') {
    return {
      Platform: { OS: 'ios' },
      Alert: { alert: () => {} },
      StyleSheet: { create: (x: any) => x },
      NativeModules: { EXDevLauncher: {} },
      AppRegistry: { registerComponent: () => {} }
    };
  }
  if (id === 'expo-secure-store') {
    return {
      setItemAsync: async () => {},
      getItemAsync: async () => null,
      deleteItemAsync: async () => {}
    };
  }
  if (id === 'expo-constants') {
    return {
      default: {
        expoConfig: {
          extra: {
            eas: { projectId: 'mock-id' }
          }
        }
      }
    };
  }
  if (id === 'expo-modules-core') {
    return {
      EventEmitter: mockExpo.EventEmitter,
      NativeModule: class {},
      requireNativeModule: () => ({}),
      SharedObject: class {},
      requireOptionalNativeModule: () => null
    };
  }
  if (id === 'expo-router') {
    return {
      router: { push: () => {}, replace: () => {} },
      useRouter: () => ({ push: () => {}, replace: () => {} })
    };
  }
  if (id === '@expo/vector-icons') {
    return { Ionicons: {} };
  }
  if (id === 'expo-haptics') {
    return {
      impactAsync: async () => {},
      notificationAsync: async () => {},
      NotificationFeedbackType: { Success: 'success' }
    };
  }

  return originalRequire.apply(this, arguments as any);
};

// Dynamically import the suite to ensure the require hook is active
import('./suite');
