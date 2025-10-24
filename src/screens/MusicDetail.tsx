import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'MusicDetail'>;

const MusicDetail: React.FC<Props> = ({ route }) => {
  const { songId } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Music Detail for {songId}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24 },
});

export default MusicDetail;
