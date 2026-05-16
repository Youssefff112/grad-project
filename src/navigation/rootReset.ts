import { CommonActions } from '@react-navigation/native';

type DispatchNav = { dispatch: (action: ReturnType<typeof CommonActions.reset>) => void };

/**
 * Replaces the root stack with a single route so the previous screen unmounts
 * (used for bottom-tab switches and "jump to main tab" actions).
 */
export function resetToSingleRoute(
  navigation: DispatchNav,
  name: string,
  params?: Record<string, unknown>,
): void {
  navigation.dispatch(
    CommonActions.reset({
      index: 0,
      routes: [params != null ? { name, params } : { name }],
    }),
  );
}
