import { Platform } from 'react-native';
import { supabase } from './supabase';

let Notifications: any = null;
let Device: any = null;

// 동적 import (웹에서는 사용하지 않음)
async function loadModules() {
  if (Platform.OS !== 'web') {
    Notifications = require('expo-notifications');
    Device = require('expo-device');
  }
}

export async function registerForPushNotifications(profileId: string): Promise<string | null> {
  if (Platform.OS === 'web') return null;

  await loadModules();
  if (!Notifications || !Device) return null;

  // 실제 디바이스인지 확인
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  // 알림 권한 요청
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Push notification permission denied');
    return null;
  }

  // Expo Push Token 가져오기
  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: 'yedream-youth',
    });
    const token = tokenData.data;

    // DB에 토큰 저장
    const { error } = await supabase.from('push_tokens').upsert(
      {
        profile_id: profileId,
        expo_push_token: token,
        device_platform: Platform.OS,
      },
      { onConflict: 'profile_id,expo_push_token' }
    );

    if (error) console.error('Push token save error:', error);

    // Android 알림 채널 설정
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('birthday', {
        name: '생일 알림',
        importance: Notifications.AndroidImportance?.MAX,
        vibrationPattern: [0, 250, 250, 250],
      });
    }

    return token;
  } catch (e) {
    console.error('Push token error:', e);
    return null;
  }
}

// 알림 클릭 핸들러 설정
export function setupNotificationHandler(onNotificationClick: () => void) {
  if (Platform.OS === 'web' || !Notifications) return;

  // 알림 수신 시 동작
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });

  // 알림 클릭 시 동작
  const subscription = Notifications.addNotificationResponseReceivedListener(() => {
    onNotificationClick();
  });

  return () => subscription.remove();
}
