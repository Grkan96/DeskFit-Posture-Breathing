import { LogBox } from 'react-native';

// expo-notifications warns on import that push notifications aren't fully
// supported in Expo Go. We already guard the native push APIs ourselves
// (see patches/expo-notifications+*.patch) and only use local scheduled
// notifications, which do work in Expo Go — so this warning is just noise.
// Must run before `expo-notifications` is first imported (App.js), which is
// why this is imported first in index.js.
LogBox.ignoreLogs(['`expo-notifications` functionality is not fully supported in Expo Go']);
