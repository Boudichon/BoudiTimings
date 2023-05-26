import { Button, Text, TextInput, View } from 'react-native';
import React, { useState } from 'react';
import notifee, { TimestampTrigger, TriggerType } from '@notifee/react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import BackgroundService from 'react-native-background-actions';
import { Image } from 'react-native';
import moment from 'moment';

interface Timing {
  date: Date;
  displayDate: string;
  fullLine: string;
}

const App = () => {
  const [displayPreview, setDisplayPreview] = useState(false);
  const [inputCommands, setInputCommands] = useState<string>('');
  const [delayInSeconds, setDelayInSeconds] = useState<string>('30');
  const [commands, setCommands] = useState<Timing[]>([]);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [countdownText, setCountdownText] = useState<string>("");

  async function configureNotifs() {
    await notifee.requestPermission()

    // Create a channel (required for Android)
    await notifee.createChannel({
      id: 'default',
      name: 'Default Channel',
      sound: 'alarm',
    });
  }

  function getDelayInMs() {
    return Number(delayInSeconds) * 1000;
  }

  async function updateNotificationIds(notifId: string) {
    var notifIds: string | null = await AsyncStorage.getItem('notifIds');
    if (!notifIds) {
      notifIds = "";
    }
    notifIds += notifId + ",";
  }

  async function getNotificationIds() {
    var notifIds: string | null = await AsyncStorage.getItem('notifIds');
    if (!notifIds) {
      notifIds = "";
    }
    return notifIds.split(',').filter(x => !!x);
  }

  async function sendAttackNotif(timing: Timing) {
    var notifId = null;
    if (timing.date.getTime() - getDelayInMs() <= 0) {
      notifId = await notifee.displayNotification(
        {
          title: 'Attack to send',
          body: timing.displayDate,
          android: {
            smallIcon: 'ic_boudilogo', // optional, defaults to 'ic_launcher'.
            channelId: 'default',
            // sound: 'alarm',
          },
        },
      );
    } else {
      // Create a time-based trigger
      var trigger: TimestampTrigger = {
        type: TriggerType.TIMESTAMP,
        timestamp: timing.date.getTime() - getDelayInMs(),
      };

      // Create a trigger notification
      notifId = await notifee.createTriggerNotification(
        {
          title: 'Attack to send',
          body: timing.displayDate,
          android: {
            smallIcon: 'ic_boudilogo', // optional, defaults to 'ic_launcher'.
            channelId: 'default',
            // sound: 'alarm',
          },
        },
        trigger,
      );
    }
    await updateNotificationIds(notifId);
  }

  async function handleResetClick() {
    await notifee.cancelAllNotifications();
    await BackgroundService.stop();
    setDisplayPreview(false);
    setIsRunning(false);
  }

  async function onStartCountdowns() {
    configureNotifs();
    checkAlLDates();
    setDisplayPreview(true);
  }

  function handleBackClick() {
    setDisplayPreview(false);
  }

  async function handleStartClick() {
    setIsRunning(true);
    // startCountdownNotif();
    background();
  }

  // function startCountdownNotif() {
  //   notifee.displayNotification({
  //     title: `Next attack at ${allDates[currentIndex].displayDate}`,
  //     body: 'Body',
  //     subtitle: 'Subtitle',
  //     android: {
  //       channelId: 'default',
  //       showChronometer: true,
  //       chronometerDirection: 'down',
  //       timestamp: allDates[currentIndex].date.getTime(), // 5 minutes
  //     },
  //   });
  // }

  let allDates: Timing[] = [];
  let currentIndex = 0;

  function checkAlLDates() {
    allDates = [];
    var allLines = inputCommands.split('\n');
    var lastManualDate: string = "";

    for (var i = 0; i < allLines.length; i++) {
      const line = allLines[i].trim(); // Trim whitespace from start and end of line

      if (!line || line === "") {
        continue;
      }

      if (line.startsWith("[b]") || line.startsWith("[s][b]")) {
        const cleanDateLine = cleanLineFromBB(line);
        var possibleDate = cleanDateLine.match(/\d{4}-\d{2}-\d{2}/);
        if (possibleDate !== null) {
          lastManualDate = possibleDate[0];
        }
        continue;
      }

      const cleanLine = cleanLineFromBB(line);
      var result = getTime(cleanLine, lastManualDate);

      if (!result) continue;

      var timeValue = result.date;
      var isSlash = result.isSlash;
      var isInverted = result.isInverted;

      if (!timeValue) continue;

      var dateToCheck = timeValue;
      if (isSlash) {
        dateToCheck = convertSlashDate(dateToCheck);
      } else if (isInverted) {
        dateToCheck = invertDashDate(dateToCheck);
      }

      var dateTimeGmtPlusOne = moment(dateToCheck).utcOffset("+01:00", true).toDate();

      var timing: Timing = {
        date: dateTimeGmtPlusOne,
        displayDate: timeValue,
        fullLine: line,
      };

      allDates.push(timing);
    }
    allDates.sort((a, b) => a.date?.getTime() - b.date?.getTime());
    currentIndex = allDates.findIndex(obj => obj.date > new Date());
    setCommands(allDates);
  }

  function getNextAttack(timings: Timing[] | undefined) {
    if (!timings) return;
    var index = timings.findIndex(obj => obj.date > new Date());
    if (index < 0) return;
    return timings[index];
  }

  function getLastAttack(timings: Timing[] | undefined) {
    if (!timings) return;
    return timings[timings.length - 1];
  }

  function formatDuration(milliseconds: number) {
    let seconds = Math.floor(milliseconds / 1000) % 60;
    let minutes = Math.floor(milliseconds / (1000 * 60)) % 60;
    let hours = Math.floor(milliseconds / (1000 * 60 * 60));

    if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    } else if (minutes > 0) {
      if (seconds > 0) {
        return `${minutes} minute${minutes > 1 ? 's' : ''} ${seconds} second${seconds > 1 ? 's' : ''}`;
      } else {
        return `${minutes} minute${minutes > 1 ? 's' : ''}`;
      }
    } else {
      return `${seconds} second${seconds > 1 ? 's' : ''}`;
    }
  }

  function dateToTime(date: Date | undefined) {
    if (!date) return;
    return moment(date).format("HH:mm:ss");
  }

  async function background() {
    BackgroundService.stop();
    // if (allDates[currentIndex].date.getTime() - new Date().getTime() > (1000 * 60 * 60 * 24)) {
    //   Alert.alert("Warning",
    //     "The next attack is more than 24 hours away. In order to avoid unnecessary battery drain, you should wait until the timings are closer.",
    //     [
    //       {
    //         text: "OK", onPress: () => {
    //           handleBackClick();
    //         }
    //       }
    //     ]);
    //   return;
    // }

    console.log("BACKGROUND TASK STARTED");
    const sleep = (time: any) => new Promise<void>((resolve) => setTimeout(() => resolve(), time));

    // You can do anything in your task such as network requests, timers and so on,
    // as long as it doesn't touch UI. Once your task completes (i.e. the promise is resolved),
    // React Native will go into "paused" mode (unless there are other tasks running,
    // or there is a foreground app).
    const veryIntensiveTask = async (parameters: any) => {
      console.log("START OF TASK");
      // Example of an infinite loop task
      await new Promise(async (resolve) => {
        var index = commands.findIndex(obj => obj.date > new Date());
        for (var i = index; i < commands.length; i++) {
          console.log(commands[i].displayDate);

          // Schedule the notif
          sendAttackNotif(commands[i]);

          // Update the countdown
          while (commands[i].date.getTime() > new Date().getTime()) {
            if (!BackgroundService.isRunning()) { return; }
            var countdownText = formatDuration(commands[i].date.getTime() - new Date().getTime());
            await BackgroundService.updateNotification({ taskTitle: 'Next attack in: ' + countdownText, taskDesc: "Launch at: " + dateToTime(commands[i].date) }); // Only Android, iOS will ignore this call
            setCountdownText(countdownText);
            await sleep(1000);
          }
          console.log("Going to next!");
        }

        await BackgroundService.stop();
      });
    };

    const options = {
      taskName: 'TW Planner',
      taskTitle: 'Next attack in:',
      taskDesc: '',
      taskIcon: {
        name: 'ic_boudilogo',
        type: 'mipmap',
      },
      color: '#ff00ff',
      // linkingURI: 'https://enp12.tribalwars.net/game.php?village=13337&screen=overview', // See Deep Linking for more info
      parameters: {
        delay: 1000,
      },
    };

    await BackgroundService.start(veryIntensiveTask, options);
    // iOS will also run everything here in the background until .stop() is called
    // await BackgroundService.stop();
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingLeft: 20, paddingRight: 20 }}>
      {displayPreview ? (
        !isRunning ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ marginBottom: 10 }}>Amount of commands found: {commands?.length}</Text>
            <Text style={{ marginBottom: 10 }}>Timing of the next command: {getNextAttack(commands)?.displayDate}</Text>
            {getLastAttack(commands) && (
              <Text style={{ marginBottom: 10 }}>Timing of the last command: {getLastAttack(commands)?.displayDate}</Text>
            )}
            <Text style={{ marginBottom: 10 }}>Click "Start" to launch the countdown and notifications</Text>
            <View style={{ flexDirection: 'row' }}>
              <View style={{ marginRight: 10 }}>
                <Button title="Back" onPress={handleBackClick} />
              </View>
              <Button title="Start" onPress={handleStartClick} />
            </View>
          </View>
        ) : (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 20 }}>{countdownText}</Text>
            <Text>Launch at {dateToTime(getNextAttack(commands)?.date)} (local time)</Text>
            <View style={{ marginTop: 100 }}>
              <Button title="Reset" onPress={handleResetClick} />
            </View>
          </View>
        )
      ) : (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingLeft: 20, paddingRight: 20, width: "100%" }}>
          <Image source={require('./images/logo.png')} style={{ width: 100, height: 100, marginBottom: 10 }} />
          <Text style={{ fontSize: 24, fontWeight: 'bold' }}>Command Timer</Text>
          <Text style={{ marginTop: 10 }}>
            Paste your text commands in the box below and click "Start countdowns" to set up timers for each command. A
            warning sound will play a few seconds before the attacks need to be sent.
          </Text>
          <Text style={{ fontSize: 16, marginTop: 40 }}>Commands</Text>
          <TextInput
            style={{ height: 100, width: "100%", borderWidth: 1, borderColor: '#aaa', padding: 10, marginBottom: 40 }}
            multiline
            numberOfLines={5}
            value={inputCommands}
            onChangeText={setInputCommands}
          />
          <Text style={{ marginBottom: 20 }}>Warning delay (in seconds)</Text>
          <TextInput
            style={{ width: 100, borderWidth: 1, borderColor: 'black', marginBottom: 10 }}
            keyboardType="numeric"
            value={delayInSeconds}
            onChangeText={setDelayInSeconds}
          />
          <Text style={{ fontSize: 12, marginBottom: 30 }}>Entering 30 will make the warning sound 30 seconds before the timer reaches zero.</Text>
          <Button title="Start Countdown" onPress={onStartCountdowns} />
        </View>
      )}
    </View>
  );
};

function getTime(line: string, lastDateTime: string) {
  // Check full dates using dashes
  var times = line.match(/\b\d{2}:\d{2}:\d{2}\b/g);
  var dates = line.match(/\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}/g);
  var firstDate = null;
  var isSlash = false;
  var isInverted = false;
  if (!dates || dates.length == 0) {
    // Check full dates using slashes
    dates = line.match(/\d{2}\/\d{2}\/\d{4}\s\d{2}:\d{2}:\d{2}/g);
    isSlash = true;
  }
  if (!dates || dates.length == 0) {
    // Check full dates using inverted dashes
    dates = line.match(/\d{2}-\d{2}-\d{4}\s\d{2}:\d{2}:\d{2}/g);
    isInverted = true;
    isSlash = false;

    if (!dates?.length) isInverted = false;
  }
  if (!times?.length) {
    return null;
  }

  // If more times than dates, use the time and last time.
  if (!dates || (times?.length > dates?.length && times?.length < 3)) {
    firstDate = lastDateTime + " " + times[0];
  } else {
    firstDate = dates.reduce((a, b) => {
      return new Date(a) < new Date(b) ? a : b;
    });
  }
  return { date: firstDate, isSlash, isInverted };
}

function cleanLineFromBB(line: string) {
  return line.replaceAll("[b]", "").replaceAll("[/b]", "");
}

function invertDashDate(datetimeStr: string) {
  const [dateStr, timeStr] = datetimeStr.split(' '); // split date and time
  const [day, month, year] = dateStr.split('-'); // split date into day, month and year
  const formattedDateStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`; // format date string as "yyyy-mm-dd"

  const formattedDatetimeStr = `${formattedDateStr} ${timeStr}`; // combine formatted date and time strings
  return formattedDatetimeStr;
}

function convertSlashDate(datetimeStr: string) {
  const [dateStr, timeStr] = datetimeStr.split(' '); // split date and time
  const [day, month, year] = dateStr.split('/'); // split date into day, month and year
  const formattedDateStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`; // format date string as "yyyy-mm-dd"

  const formattedDatetimeStr = `${formattedDateStr} ${timeStr}`; // combine formatted date and time strings
  return formattedDatetimeStr;
}

export default App;
