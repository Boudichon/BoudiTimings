import { Button, Text, TextInput, View } from 'react-native';
import { Command, parseCommands } from './utils/timingHelper';
import React, { useState } from 'react';
import { configureNotifications, StopAllNotifications as stopAllNotifications } from './utils/notificationHelper';
import { isBackgroundServiceRunning, startBackgroundService, stopBackgroundService } from './utils/backgroundServiceHelper';

import { Image } from 'react-native';

enum Screen {
  Form,
  Preview,
  Started
}

const App = () => {
  const [inputCommands, setInputCommands] = useState<string>('');
  const [delayInSeconds, setDelayInSeconds] = useState<string>('60');
  const [commands, setCommands] = useState<Command[]>([]);
  const [currentScreen, setCurrentScreen] = useState<Screen>(0);

  if (isBackgroundServiceRunning() && currentScreen != Screen.Started) {
    setCurrentScreen(Screen.Started);
  }

  function getDelayInMs() {
    return Number(delayInSeconds) * 1000;
  }

  async function handleResetClick() {
    await stopAllNotifications();
    await stopBackgroundService();
    setCurrentScreen(Screen.Form);
  }

  async function onStartCountdowns() {
    configureNotifications();

    var commands = parseCommands(inputCommands);
    setCommands(commands);

    setCurrentScreen(Screen.Preview);
  }

  function handleBackClick() {
    setCurrentScreen(Screen.Form);
  }

  async function handleStartClick() {
    setCurrentScreen(Screen.Started);
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

  switch (currentScreen) {
    case Screen.Form:
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingLeft: 20, paddingRight: 20 }}>
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
          <Text style={{ fontSize: 16, marginBottom: 20 }}>Warning delay (in seconds)</Text>
          <TextInput
            style={{ width: 100, borderWidth: 1, borderColor: 'black', marginBottom: 10 }}
            keyboardType="numeric"
            value={delayInSeconds}
            onChangeText={setDelayInSeconds}
          />
          <Text style={{ fontSize: 12, marginBottom: 30 }}>Entering 60 will send the notification 60 seconds before the command needs to be sent.</Text>
          <Button title="Start Countdown" onPress={onStartCountdowns} />
        </View>
      );
    case Screen.Preview:
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingLeft: 20, paddingRight: 20 }}>
          <Image source={require('./images/logo.png')} style={{ width: 100, height: 100, marginBottom: 35 }} />
          <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>Confirmation</Text>

          {!!getNextAttack(commands) ? (
            <View>
              <Text style={{ marginBottom: 20 }}>Amount of commands found: {commands?.length}</Text>
              <Text style={{ marginBottom: 20 }}>Timing of the next command: {getNextAttack(commands)?.displayDate}</Text>
              {getLastAttack(commands) && (
                <Text style={{ marginBottom: 20 }}>Timing of the last command: {getLastAttack(commands)?.displayDate}</Text>
              )}
              <Text style={{ marginBottom: 50 }}>Click "Start" to launch the countdown and notifications</Text>
            </View>
          ) : (
            <Text style={{ marginBottom: 50 }}>Nothing future attacks was found. Please check your commands.</Text>
          )}
          <View style={{ flexDirection: 'row' }}>
            <View style={{ marginRight: 30 }}>
              <Button title="Back" onPress={handleBackClick} />
            </View>
            {!!getNextAttack(commands) && (
              <Button title="Start" onPress={handleStartClick} />
            )}
          </View>
        </View>
      );
    case Screen.Started:
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingLeft: 20, paddingRight: 20 }}>
          <Image source={require('./images/logo.png')} style={{ width: 100, height: 100, marginBottom: 35 }} />
          <Text style={{ fontSize: 30, fontWeight: "bold", marginBottom: 50 }}>Countdown started.</Text>
          <Text style={{ marginBottom: 20, textAlign: "left", width: "100%" }}>You can close the app now, the timer will keep running in the background.</Text>
          <Text style={{ marginBottom: 20, textAlign: "left", width: "100%" }}>A notification will be sent before every attacks.</Text>
          <Text style={{ marginBottom: 20, textAlign: "left", width: "100%" }}>You can keep track of the time remaining before the next attack using the notification.</Text>
          <View style={{ marginTop: 75 }}>
            <Button title="Stop & Reset" onPress={handleResetClick} />
          </View>
        </View>
      );
  }
};

export default App;
