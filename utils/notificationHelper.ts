import notifee, { TimestampTrigger, TriggerType } from '@notifee/react-native';

import { Command } from './timingHelper';

export async function configureNotifications() {
    await notifee.requestPermission()

    // Create a channel (required for Android)
    await notifee.createChannel({
        id: 'default',
        name: 'Default Channel',
        sound: 'alarm',
    });
}

// Sends the notification for the specified timing based on the delay provided, or instantly if the delay is already passed.
export async function prepareAttackNotification(timing: Command, notificationDelay: number) {
    if (timing.date.getTime() - new Date().getTime() - notificationDelay <= 0) {
        await SendInstantCommandNotification(timing);
    } else {
        await SendDelayedCommandNotification(timing, notificationDelay);
    }
}

async function SendInstantCommandNotification(command: Command) {
    await notifee.displayNotification(
        {
            title: 'Attack to send',
            body: command.displayDate,
            android: {
                smallIcon: 'ic_boudilogo',
                channelId: 'default',
                sound: 'alarm',
            },
        },
    );
}

async function SendDelayedCommandNotification(command: Command, delay: number) {
    // Create a time-based trigger
    var trigger: TimestampTrigger = {
        type: TriggerType.TIMESTAMP,
        timestamp: command.date.getTime() - delay,
    };

    // Create a trigger notification
    await notifee.createTriggerNotification(
        {
            title: 'Attack to send',
            body: command.displayDate,
            android: {
                smallIcon: 'ic_boudilogo',
                channelId: 'default',
                sound: 'alarm',
            },
        },
        trigger,
    );
}

export async function StopAllNotifications() {
    await notifee.cancelAllNotifications();
}