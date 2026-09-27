import 'react-native-gesture-handler';
import { registerRootComponent } from 'expo';

import App from './App';
import { ThemeProvider } from './lib/theme';
import { LocaleProvider } from './lib/i18n';

function Root() {
  return (
    <ThemeProvider>
      <LocaleProvider>
        <App />
      </LocaleProvider>
    </ThemeProvider>
  );
}

// registerRootComponent calls AppRegistry.registerComponent('main', () => Root);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(Root);

// Android ana ekran widget'ının headless görev işleyicisini kaydeder.
// `react-native-android-widget` native modül gerektirir ve Expo Go'da mevcut
// değildir; bu fonksiyon Expo Go kontrolünü ve require()'ı try/catch içinde
// güvenle yapar, hiçbir koşulda uygulama açılışını etkilemez.
// Bkz. lib/widgetUpdate.js.
try {
  const { registerWidgetTaskHandlerSafely } = require('./lib/widgetUpdate');
  registerWidgetTaskHandlerSafely();
} catch (e) {
  // Widget modülü yok/yüklenemedi — uygulama normal şekilde devam eder.
}
