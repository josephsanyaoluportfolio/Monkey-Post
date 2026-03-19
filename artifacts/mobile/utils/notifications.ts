import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

const CHANNEL_ID = "match-alerts";
const TAG_TWO_MIN = "monkey-post-two-min";
const TAG_TIME_UP = "monkey-post-time-up";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function setupNotificationChannel() {
  if (Platform.OS === "web") return;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: "Match Alerts",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 400, 100, 400],
      lightColor: "#16a34a",
      lockscreenVisibility:
        Notifications.AndroidNotificationVisibility.PUBLIC,
      bypassDnd: true,
      sound: "default",
      enableVibrate: true,
    });
  }
}

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return true;
  const { status } = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: false,
      allowSound: true,
      allowAnnouncements: true,
    },
  });
  return status === "granted";
}

export async function scheduleMatchNotifications(
  remainingSeconds: number
): Promise<void> {
  if (Platform.OS === "web") return;

  await cancelMatchNotifications();

  const secondsUntilTwoMin = remainingSeconds - 120;

  if (secondsUntilTwoMin > 0) {
    await Notifications.scheduleNotificationAsync({
      identifier: TAG_TWO_MIN,
      content: {
        title: "⏱️ 2 minutes left!",
        body: "Get ready — final 2 minutes on the pitch.",
        sound: "default",
        ...(Platform.OS === "android" && {
          channelId: CHANNEL_ID,
          vibrationPattern: [0, 300, 100, 300],
          priority: Notifications.AndroidNotificationPriority.MAX,
        }),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: Math.floor(secondsUntilTwoMin),
      },
    });
  }

  await Notifications.scheduleNotificationAsync({
    identifier: TAG_TIME_UP,
    content: {
      title: "🎺 Time's up!",
      body: "Match over — tap to pick a winner or call it a draw.",
      sound: "default",
      ...(Platform.OS === "android" && {
        channelId: CHANNEL_ID,
        vibrationPattern: [0, 500, 150, 500, 150, 500],
        priority: Notifications.AndroidNotificationPriority.MAX,
      }),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: Math.max(1, Math.floor(remainingSeconds)),
    },
  });
}

export async function cancelMatchNotifications(): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    await Notifications.cancelScheduledNotificationAsync(TAG_TWO_MIN);
  } catch (_) {}
  try {
    await Notifications.cancelScheduledNotificationAsync(TAG_TIME_UP);
  } catch (_) {}
}
