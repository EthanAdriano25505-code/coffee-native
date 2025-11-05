import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import Slider from '@react-native-community/slider';
import { usePlayback } from '../contexts/PlaybackContext';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/types';

const { width } = Dimensions.get('window');

export default function PlayerScreen({ route }: { route: RouteProp<RootStackParamList, 'Player'> }) {
  const paramSong = route.params?.song;
  const { currentSong, isPlaying, positionMillis, durationMillis, play, pause, next, prev, seek, togglePlay } = usePlayback();

  // ensure playback started if we navigated here with a song param
  useEffect(() => {
    if (!currentSong && paramSong) {
      const payload = {
        id: paramSong.id,
        title: paramSong.title,
        artist: paramSong.artist ?? undefined,
        cover_url: paramSong.cover_url ?? undefined,
        uri: paramSong.audio_url ? { uri: paramSong.audio_url } : undefined,
      };
      play(payload);
    }
  }, [paramSong]);

  const song = currentSong ?? paramSong;
  const [seeking, setSeeking] = useState(false);
  const [localPos, setLocalPos] = useState(0);

  useEffect(() => { if (!seeking) setLocalPos(positionMillis ?? 0); }, [positionMillis, seeking]);

  const onSeekComplete = async (value: number) => {
    setSeeking(false);
    if (seek) await seek(Math.round(value));
  };

  return (
    <View style={styles.container}>
  <Image source={song?.cover_url ? { uri: String(song.cover_url) } : undefined} style={styles.cover} />
      <Text style={styles.title}>{song?.title}</Text>
      <Text style={styles.artist}>{song?.artist}</Text>

      <View style={styles.controls}>
        <TouchableOpacity onPress={prev}><Text style={styles.control}>⏮</Text></TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            // optimistic UI handled in context; call togglePlay without awaiting
            togglePlay();
          }}
          style={styles.playButton}
        >
          <Text style={styles.playText}>{isPlaying ? '⏸' : '▶'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={next}><Text style={styles.control}>⏭</Text></TouchableOpacity>
      </View>

      <View style={styles.progressRow}>
        <Text style={styles.time}>{formatMillis(seeking ? localPos : positionMillis)}</Text>
        <Slider
          style={{ flex: 1 }}
          minimumValue={0}
          maximumValue={durationMillis || 0}
          value={seeking ? localPos : (positionMillis ?? 0)}
          minimumTrackTintColor="#2f6dfd"
          maximumTrackTintColor="#ddd"
          thumbTintColor="#2f6dfd"
          onValueChange={(v) => { setSeeking(true); setLocalPos(v); }}
          onSlidingComplete={onSeekComplete}
        />
        <Text style={styles.time}>{formatMillis(durationMillis)}</Text>
      </View>

      <View style={styles.extraRow}>
        <TouchableOpacity style={styles.smallBtn}><Text>🔁</Text></TouchableOpacity>
        <TouchableOpacity style={styles.smallBtn}><Text>🔀</Text></TouchableOpacity>
      </View>
    </View>
  );
}

function formatMillis(ms: number | null | undefined): string {
  if (!ms) return '0:00';
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

const COVER = Math.min(width - 48, 420);
const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', padding: 20, backgroundColor: '#fff' },
  cover: { width: COVER, height: COVER, borderRadius: 12, backgroundColor: '#eee' },
  title: { marginTop: 18, fontSize: 20, fontWeight: '800' },
  artist: { color: '#666', marginTop: 6 },
  controls: { flexDirection: 'row', alignItems: 'center', marginTop: 18 },
  control: { fontSize: 22, paddingHorizontal: 12 },
  playButton: { marginHorizontal: 10, backgroundColor: '#2f6dfd', padding: 12, borderRadius: 30 },
  playText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  progressRow: { width: '100%', flexDirection: 'row', alignItems: 'center', marginTop: 18 },
  time: { width: 44, textAlign: 'center', color: '#666', fontSize: 12 },
  extraRow: { flexDirection: 'row', marginTop: 20, alignItems: 'center' },
  smallBtn: { padding: 10, marginHorizontal: 8, backgroundColor: '#f3f3f3', borderRadius: 8 },
});
