import { Text, View } from 'react-native';

import {Picker} from '@react-native-picker/picker';
import React from 'react';

interface TimezoneSelectProps {
  selectedValue: string;
  onValueChange: (value: string) => void;
}

const TimezoneSelect: React.FC<TimezoneSelectProps> = ({
  selectedValue,
  onValueChange,
}) => {
  return (
    <View>
      <Text>Timezone of the timings</Text>
      <Picker
        selectedValue={selectedValue}
        onValueChange={onValueChange}
      >
        <Picker.Item label="(GMT -3:00)" value="-03:00" />
        <Picker.Item label="(GMT -2:00)" value="-02:00" />
        <Picker.Item label="(GMT -1:00)" value="-01:00" />
        <Picker.Item label="(GMT)" value="+00:00" />
        <Picker.Item label="(GMT +1:00) SERVER TIME" value="+01:00" />
        <Picker.Item label="(GMT +2:00)" value="+02:00" />
        <Picker.Item label="(GMT +3:00)" value="+03:00" />
        <Picker.Item label="(GMT +3:30)" value="+03:50" />
        <Picker.Item label="(GMT +4:00)" value="+04:00" />
        <Picker.Item label="(GMT +4:30)" value="+04:50" />
      </Picker>
      <Text>Current Time in the selected timezone: </Text>
      <Text>{/* Add the current time logic here */}</Text>
    </View>
  );
};

export default TimezoneSelect;
