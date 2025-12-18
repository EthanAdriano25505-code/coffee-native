import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'MusicDetail'>;

const MusicDetail: React.FC<Props> = ({ route }) => {
  const navigation = useNavigation<any>();
  const { songId } = route.params;

  return (
    <View style={styles.container}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <TouchableOpacity onPress={() => { if (navigation?.canGoBack && navigation.canGoBack()) navigation.goBack(); else navigation?.navigate?.('Home'); }} style={{ padding: 6, marginRight: 8 }}>
          <Feather name="chevron-left" size={20} />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: '800' }}>Details</Text>
      </View>
      <Text style={styles.title}>Music Detail for {songId}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24 },
});

export default MusicDetail;
