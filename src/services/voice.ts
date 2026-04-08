// Voice service — handles mic recording, Whisper transcription, and TTS.
// Recording uses expo-av. TTS uses expo-speech (native Siri/Google voices).

import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RecordingState = 'idle' | 'recording' | 'processing';

// ---------------------------------------------------------------------------
// TTS — text-to-speech
// ---------------------------------------------------------------------------

const TTS_OPTIONS: Speech.SpeechOptions = {
  language: 'en-US',
  pitch: 1.0,
  rate: Platform.OS === 'ios' ? 0.52 : 0.9, // iOS rate scale differs
  // On iOS, voice 'com.apple.ttsbundle.Samantha-compact' is the Siri-like voice.
  // Leaving voice unset lets the OS pick the best installed voice.
};

let isSpeaking = false;

export function speak(text: string, onDone?: () => void): void {
  stopSpeaking();
  // Strip markdown-style formatting for cleaner TTS.
  const clean = text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    .replace(/#{1,6}\s/g, '')
    .replace(/•\s/g, '')
    .replace(/\n{2,}/g, '. ')
    .replace(/\n/g, ' ')
    .trim();

  isSpeaking = true;
  Speech.speak(clean, {
    ...TTS_OPTIONS,
    onDone: () => {
      isSpeaking = false;
      onDone?.();
    },
    onStopped: () => {
      isSpeaking = false;
    },
    onError: () => {
      isSpeaking = false;
    },
  });
}

export function stopSpeaking(): void {
  if (Speech.isSpeakingAsync) {
    Speech.stop();
  }
  isSpeaking = false;
}

export function getIsSpeaking(): boolean {
  return isSpeaking;
}

// ---------------------------------------------------------------------------
// Recording
// ---------------------------------------------------------------------------

let recordingRef: Audio.Recording | null = null;

export async function requestMicPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const { granted } = await Audio.requestPermissionsAsync();
  return granted;
}

export async function startRecording(): Promise<void> {
  if (recordingRef) {
    await stopRecording();
  }

  await Audio.setAudioModeAsync({
    allowsRecordingIOS: true,
    playsInSilentModeIOS: true,
  });

  const { recording } = await Audio.Recording.createAsync(
    Audio.RecordingOptionsPresets.HIGH_QUALITY,
  );
  recordingRef = recording;
}

export async function stopRecording(): Promise<string | null> {
  if (!recordingRef) return null;

  try {
    await recordingRef.stopAndUnloadAsync();
    const uri = recordingRef.getURI();
    recordingRef = null;

    await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

    if (!uri) return null;
    return await transcribeWithWhisper(uri);
  } catch {
    recordingRef = null;
    return null;
  }
}

export async function cancelRecording(): Promise<void> {
  if (!recordingRef) return;
  try {
    await recordingRef.stopAndUnloadAsync();
  } catch {
    // ignore
  }
  recordingRef = null;
  await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
}

// ---------------------------------------------------------------------------
// Whisper transcription via Groq
// ---------------------------------------------------------------------------

async function transcribeWithWhisper(uri: string): Promise<string | null> {
  const apiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY;
  if (!apiKey) return null;

  try {
    // Fetch the audio file as a blob.
    const response = await fetch(uri);
    const blob = await response.blob();

    // Determine file extension from URI.
    const ext = uri.split('.').pop()?.toLowerCase() ?? 'm4a';
    const mimeType = ext === 'wav' ? 'audio/wav' : 'audio/m4a';

    const formData = new FormData();
    // React Native FormData accepts { uri, name, type } as a file entry.
    formData.append('file', {
      uri,
      name: `recording.${ext}`,
      type: mimeType,
    } as any);
    formData.append('model', 'whisper-large-v3-turbo');
    formData.append('language', 'en');
    formData.append('response_format', 'json');

    const transcribeResponse = await fetch(
      'https://api.groq.com/openai/v1/audio/transcriptions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: formData,
      },
    );

    if (!transcribeResponse.ok) return null;

    const json = await transcribeResponse.json();
    return json?.text?.trim() ?? null;
  } catch {
    return null;
  }
}
