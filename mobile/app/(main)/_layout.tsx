import { RootNavigator } from '../../src/navigation/RootNavigator';

/**
 * Main app: tabs + stack (existing React Navigation tree).
 * Shown only when user is authenticated.
 */
export default function MainLayout() {
  return <RootNavigator />;
}
