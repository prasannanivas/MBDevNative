import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Platform } from "react-native";
import axios from "axios";
import API_BASE_URL from '../config/api';

// Configure how notifications appear when the app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotificationsAsync() {
  let token;

  console.log('🔔 Starting push notification registration...');
  console.log('📱 Device.isDevice:', Device.isDevice);

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    console.log('📱 Current permission status:', existingStatus);

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
      console.log('📱 Permission request result:', status);
    }

    if (finalStatus !== "granted") {
      console.log("❌ Failed to get push token for push notification!");
      return null;
    }

    try {
      token = (
        await Notifications.getExpoPushTokenAsync({
          projectId: Constants.expoConfig?.extra?.eas?.projectId,
        })
      ).data;
      console.log("✅ Push token obtained:", token);
    } catch (error) {
      console.error("❌ Error getting push token:", error);
      return null;
    }
  } else {
    console.log("⚠️ Must use physical device for push notifications");
  }

  // For Android, set notification channels
  if (Platform.OS === "android") {
    Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#377473",
    });

    Notifications.setNotificationChannelAsync("reminders", {
      name: "Reminders",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#377473",
      sound: "default",
      enableLights: true,
      enableVibrate: true,
    });
  }

  return token;
}

// Register device token with server
export async function registerDeviceOnServer(brokerId, token, authToken) {
  try {
    console.log("📱 Registering broker device with server...");
    console.log("   Broker ID:", brokerId);
    console.log("   Token:", token ? token.substring(0, 50) + '...' : 'null');
    console.log("   Platform:", Platform.OS);
    console.log("   Has authToken:", !!authToken);

    const payload = {
      userId: brokerId,
      token,
      userType: "sub-admin", // Use "sub-admin" to match server-side mortgage broker role
      platform: Platform.OS,
    };

    console.log("📤 Sending registration request with payload:", {
      ...payload,
      token: payload.token ? payload.token.substring(0, 50) + '...' : 'null'
    });

    const response = await axios.post(
      `${API_BASE_URL}/notifications/register-device`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    console.log("✅ Device registered successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Error registering device:");
    console.error("   Status:", error.response?.status);
    console.error("   Data:", error.response?.data);
    console.error("   Message:", error.message);
    throw error;
  }
}

// Schedule local notification for a reminder
export async function scheduleReminderNotification(reminder, clientName) {
  try {
    const reminderDate = new Date(reminder.date);
    const now = new Date();
    
    if (reminderDate <= now) {
      console.log("Reminder is in the past, not scheduling notification");
      return null;
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `Reminder: ${clientName}`,
        body: reminder.comment || reminder.type || "Client reminder",
        data: { 
          reminderId: reminder._id,
          clientId: reminder.clientId,
          type: "reminder"
        },
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: {
        date: reminderDate,
        channelId: "reminders",
      },
    });

    console.log(`✅ Scheduled notification for ${clientName} at ${reminderDate}`);
    return notificationId;
  } catch (error) {
    console.error("Error scheduling reminder notification:", error);
    return null;
  }
}

// Cancel a scheduled notification
export async function cancelReminderNotification(notificationId) {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
    console.log("✅ Cancelled notification:", notificationId);
  } catch (error) {
    console.error("Error cancelling notification:", error);
  }
}

// Cancel all scheduled notifications
export async function cancelAllReminderNotifications() {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log("✅ Cancelled all scheduled notifications");
  } catch (error) {
    console.error("Error cancelling all notifications:", error);
  }
}

// Get all scheduled notifications
export async function getScheduledNotifications() {
  try {
    const notifications = await Notifications.getAllScheduledNotificationsAsync();
    return notifications;
  } catch (error) {
    console.error("Error getting scheduled notifications:", error);
    return [];
  }
}
