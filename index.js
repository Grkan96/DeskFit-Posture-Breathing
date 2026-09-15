import 'react-native-gesture-handler';
import { registerRootComponent } from 'expo';

import App from './App';
import { ThemeProvider } from './lib/theme';

function Root() {
  return (
    <ThemeProvider>
      <App />
    </ThemeProvider>
  );
}

// registerRootComponent calls AppRegistry.registerComponent('main', () => Root);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(Root);
