import BackgroundService from 'react-native-background-actions';
import { Command } from "./timingHelper";
import { prepareAttackNotification } from "./notificationHelper";

async function sleep(time: any) {
    return new Promise<void>((resolve) => setTimeout(() => resolve(), time));
}

export async function stopBackgroundService() {
    await BackgroundService.stop();
}

export async function UpdateNotificationCountdown(commands: Command[], currentIndex: number) {
    var countdownText = formatDuration(commands[currentIndex].date.getTime() - new Date().getTime());

    var otherAttackIn = "";
    if (currentIndex < commands.length - 1) {
        otherAttackIn = "The subsequent attack is " + formatDuration(commands[currentIndex + 1].date.getTime() - commands[currentIndex].date.getTime()) + " later";
    }

    await BackgroundService.updateNotification({
        taskTitle: `Send in ${countdownText}`,
        taskDesc: otherAttackIn
    }); // Only Android, iOS will ignore this call
}


export async function startBackgroundService(commands: Command[], notificationDelay: number) {
    // Stops ongoing background task, if there is any
    stopBackgroundService();

    const attackNotificationsTask = async (parameters: any) => {
      await new Promise(async (resolve) => {
        var nextAttackIndex = commands.findIndex(obj => obj.date > new Date());
        for (var i = nextAttackIndex; i < commands.length; i++) {
          
          // Schedule the next notification
          prepareAttackNotification(commands[i], notificationDelay);

          // Update the countdown every second until the timing is reached
          while (commands[i].date.getTime() > new Date().getTime()) {
            if (!BackgroundService.isRunning()) { return; }

            UpdateNotificationCountdown(commands, i);
            
            await sleep(1000);
          }
        }

        await stopBackgroundService();
      });
    };

    const options = {
      taskName: 'TW Planner',
      taskTitle: 'The timing notification service is running',
      taskDesc: '',
      taskIcon: {
        name: 'ic_boudilogo',
        type: 'mipmap',
      },
      color: '#ff00ff',
      parameters: {
        delay: 1000,
      },
    };

    await BackgroundService.start(attackNotificationsTask, options);
  }


function formatDuration(milliseconds: number) {
    let seconds = Math.floor(milliseconds / 1000);
    let minutes = Math.floor(seconds / 60);
    let hours = Math.floor(minutes / 60);
    let days = Math.floor(hours / 24);

    seconds %= 60;
    minutes %= 60;
    hours %= 24;

    let result = '';

    if (days > 0) {
        result += days + ' day' + (days > 1 ? 's ' : ' ');
        result += hours + ' hour' + (hours > 1 ? 's' : '');
    } else if (hours > 0) {
        result += hours + ' hour' + (hours > 1 ? 's ' : ' ');
        result += minutes + ' minute' + (minutes > 1 ? 's' : '');
    } else if (minutes > 0) {
        result += minutes + ' minute' + (minutes > 1 ? 's ' : ' ');
        result += seconds + ' second' + (seconds > 1 ? 's' : '');
    } else {
        result += seconds + ' second' + (seconds > 1 ? 's' : '');
    }

    return result;
}