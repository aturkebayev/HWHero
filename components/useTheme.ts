import { useColorScheme } from 'react-native';
import { getColors, ThemeMode } from '@/constants/theme';

export const useTheme = () => {
  const scheme = useColorScheme();
  const mode: ThemeMode = scheme === 'dark' ? 'dark' : 'light';
  return { mode, c: getColors(mode) };
};
