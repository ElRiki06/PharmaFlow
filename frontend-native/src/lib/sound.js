import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
export function beep() { if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}); }
