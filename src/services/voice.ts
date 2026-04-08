import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

export type RecordingState = 'idle' | 'recording' | 'processing';

// ---------------------------------------------------------------------------
// TTS
// ---------------------------------------------------------------------------

export function speak(text: string, onDone?: () => void): void {
  Speech.stop();
  const clean = text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    .replace(/#{1,6}\s/g, '')
    .replace(/[-•]\s/g, '')
    .replace(/\n{2,}/g, '. ')
    .replace(/\n/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();

  Speech.speak(clean, {
    language: 'en-US',
    pitch: 1.0,
    rate: Platform.OS === 'ios' ? 0.50 : 0.88,
    onDone,
    onStopped: onDone,
    onError: onDone,
  });
}

export function stopSpeaking(): void {
  Speech.stop();
}

// ---------------------------------------------------------------------------
// Recording
// ---------------------------------------------------------------------------

let activeRecording: Audio.Recording | null = null;

export async function requestMicPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const { granted } = await Audio.requestPermissionsAsync();
  return granted;
}

export async function startRecording(): Promise<void> {
  // Clean up any leftover recording.
  if (activeRecording) {
    try { await activeRecording.stopAndUnloadAsync(); } catch { /* ignore */ }
    activeRecording = null;
  }

  await Audio.setAudioModeAsync({
    allowsRecordingIOS: true,
    playsInSilentModeIOS: true,
  });

  const { recording } = await Audio.Recording.createAsync({
    android: {
      extension: '.m4a',
      outputFormat: Audio.AndroidOutputFormat.MPEG_4,
      audioEncoder: Audio.AndroidAudioEncoder.AAC,
      sampleRate: 16000,
      numberOfChannels: 1,
      bitRate: 64000,
    },
    ios: {
      extension: '.m4a',
      outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
      audioQuality: Audio.IOSAudioQuality.HIGH,
      sampleRate: 16000,
      numberOfChannels: 1,
      bitRate: 64000,
      linearPCMBitDepth: 16,
      linearPCMIsBigEndian: false,
      linearPCMIsFloat: false,
    },
    web: {
      mimeType: 'audio/webm',
      bitsPerSecond: 64000,
    },
  });

  activeRecording = recording;
}

export async function stopAndTranscribe(): Promise<string | null> {
  if (!activeRecording) return null;
  const rec = activeRecording;
  activeRecording = null;

  try {
    await rec.stopAndUnloadAsync();
    await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
    const uri = rec.getURI();
    if (!uri) return null;
    return await transcribeWithWhisper(uri);
  } catch {
    await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
    return null;
  }
}

export async function cancelRecording(): Promise<void> {
  if (!activeRecording) return;
  const rec = activeRecording;
  activeRecording = null;
  try { await rec.stopAndUnloadAsync(); } catch { /* ignore */ }
  await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
}

// ---------------------------------------------------------------------------
// Whisper via Groq
// ---------------------------------------------------------------------------

async function transcribeWithWhisper(uri: string): Promise<string | null> {
  const apiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY;
  if (!apiKey) return null;

  const formData = new FormData();
  formData.append('file', { uri, name: 'recording.m4a', type: 'audio/m4a' } as any);
  formData.append('model', 'whisper-large-v3-turbo');
  formData.append('language', 'en');
  formData.append('response_format', 'json');

  try {
    const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: formData,
    });
    if (!res.ok) return null;
    const json = await res.json();
    return (json?.text ?? '').trim() || null;
  } catch {
    return null;
  }
}
