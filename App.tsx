/* 
  This project was made in about 3 days with no prior knowledge of React Native.
  It uses various snippets of code generated by ChatGPT and online tutorials so the code might is not super clean. (Especially the date parsing part)
*/

import { Button, Text, TextInput, View } from 'react-native';
import { Command, parseCommands } from './utils/timingHelper';
import React, { useState } from 'react';
import { configureNotifications, StopAllNotifications as stopAllNotifications } from './utils/notificationHelper';
import { startBackgroundService, stopBackgroundService } from './utils/backgroundServiceHelper';

import { Image } from 'react-native';

// TODO Check if the service is running to reopen the end screen
// TODO Display the next attack time difference to know if the timing is close or not
// TODO Check what happens when two attacks are too close to each other
// TODO Precise notifition time
// TODO Fix notification URL

const App = () => {
  const [displayPreview, setDisplayPreview] = useState(false);
  const [inputCommands, setInputCommands] = useState<string>('');
  const [delayInSeconds, setDelayInSeconds] = useState<string>('30');
  const [commands, setCommands] = useState<Command[]>([]);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  function getDelayInMs() {
    return Number(delayInSeconds) * 1000;
  }

  async function handleResetClick() {
    await stopAllNotifications();
    await stopBackgroundService();
    setDisplayPreview(false);
    setIsRunning(false);
  }

  async function onStartCountdowns() {
    configureNotifications();

    var commands = parseCommands(inputCommands);
    setCommands(commands);

    setDisplayPreview(true);
  }

  function handleBackClick() {
    setDisplayPreview(false);
  }

  async function handleStartClick() {
    setIsRunning(true);
    startBackgroundService(commands, getDelayInMs());
  }

  function getNextAttack(timings: Command[] | undefined) {
    if (!timings) return;
    var index = timings.findIndex(obj => obj.date > new Date());
    if (index < 0) return;
    return timings[index];
  }

  function getLastAttack(timings: Command[] | undefined) {
    if (!timings) return;
    return timings[timings.length - 1];
  }
  
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingLeft: 20, paddingRight: 20 }}>
      {displayPreview ? (
        !isRunning ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>Confirmation</Text>
            <Text style={{ marginBottom: 20 }}>Amount of commands found: {commands?.length}</Text>
            <Text style={{ marginBottom: 20 }}>Timing of the next command: {getNextAttack(commands)?.displayDate}</Text>
            {getLastAttack(commands) && (
              <Text style={{ marginBottom: 20 }}>Timing of the last command: {getLastAttack(commands)?.displayDate}</Text>
            )}
            <Text style={{ marginBottom: 20 }}>Click "Start" to launch the countdown and notifications</Text>
            <View style={{ flexDirection: 'row' }}>
              <View style={{ marginRight: 10 }}>
                <Button title="Back" onPress={handleBackClick} />
              </View>
              <Button title="Start" onPress={handleStartClick} />
            </View>
          </View>
        ) : (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 20 }}>Countdown started.</Text>
            <Text style={{ marginBottom: 20 }}>You can close the app. The timer will keep running in the background.</Text>
            <Text style={{ marginBottom: 20 }}>A special sound notification will be sent before every attacks.</Text>
            <Text style={{ marginBottom: 20 }}>You can keep track of the time remaining before the next attack using the notification.</Text>
            <View style={{ marginTop: 100 }}>
              <Button title="Stop & Reset" onPress={handleResetClick} />
            </View>
          </View>
        )
      ) : (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingLeft: 20, paddingRight: 20, width: "100%" }}>
          <Image source={require('./images/logo.png')} style={{ width: 100, height: 100, marginBottom: 10 }} />
          <Text style={{ fontSize: 24, fontWeight: 'bold' }}>Command Timer</Text>
          <Text style={{ marginTop: 10 }}>
            Paste your text commands in the box below and click "Start countdowns" to set up timers for each command. A
            notification will be sent before every attacks.
          </Text>
          <Text style={{ fontSize: 16, marginTop: 40 }}>Commands</Text>
          <TextInput
            style={{ height: 100, width: "100%", borderWidth: 1, borderColor: '#aaa', padding: 10, marginBottom: 10 }}
            multiline
            numberOfLines={5}
            value={inputCommands}
            onChangeText={setInputCommands} />
          <Text style={{ fontSize: 12, marginBottom: 40 }}>The commands needs to use server time.</Text>
          <Text style={{ marginBottom: 20 }}>Warning delay (in seconds)</Text>
          <TextInput
            style={{ width: 100, borderWidth: 1, borderColor: 'black', marginBottom: 10 }}
            keyboardType="numeric"
            value={delayInSeconds}
            onChangeText={setDelayInSeconds}
          />
          <Text style={{ fontSize: 12, marginBottom: 30 }}>Entering 60 will send the notification 60 seconds before the timer reaches zero.</Text>
          <Button title="Start Countdown" onPress={onStartCountdowns} />
        </View>
      )}
    </View>
  );
};

export default App;
