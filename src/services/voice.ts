/**
 * Voice service — recording via expo-av, TTS via expo-speech, transcription via Groq Whisper.
 *
 * Key facts about these APIs:
 *  - Speech.stop() is ASYNC — must be awaited before calling speak()
 *  - expo-av only allows ONE recording at a time (_recorderExists flag)
 *  - RecordingOptionsPresets.HIGH_QUALITY is the safest preset (tested by Expo)
 */

import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

export type RecordingState = 'idle' | 'recording' | 'processing';
export type VoiceError = 'permission_denied' | 'recording_failed' | 'transcription_failed' | 'tts_failed';

// ---------------------------------------------------------------------------
// TTS — expo-speech
// ---------------------------------------------------------------------------

/** Stop any ongoing speech, then speak the given text. */
export async function speakText(text: string, onDone?: () => void): Promise<void> {
  // MUST await stop() — it is async and speaking will race otherwise.
  try { await Speech.stop(); } catch { /* ignore */ }

  const clean = text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    .replace(/`(.*?)`/g, '$1')
    .replace(/#{1,6}\s/g, '')
    .replace(/[-•]\s/g, '')
    .replace(/\n{2,}/g, '. ')
    .replace(/\n/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();

  if (!clean) { onDone?.(); return; }

  Speech.speak(clean, {
    language: 'en-US',
    pitch: 1.0,
    // iOS: 0.0–1.0 maps to slow–fast; 0.5 is natural pace
    // Android: same scale but default is already ~0.9
    rate: Platform.OS === 'ios' ? 0.50 : 0.88,
    onDone,
    onStopped: onDone,
    onError: () => onDone?.(),
  });
}

/** Stop any ongoing speech immediately. */
export async function stopSpeaking(): Promise<void> {
  try { await Speech.stop(); } catch { /* ignore */ }
}

// ---------------------------------------------------------------------------
// Recording — expo-av
// ---------------------------------------------------------------------------

let _recording: Audio.Recording | null = null;

/** Request microphone permission. Returns true if granted. */
export async function requestMicPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    const { status } = await Audio.requestPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

/** Check permission without prompting. */
export async function getMicPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    const { status } = await Audio.getPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

/**
 * Start a new recording session.
 * Throws a descriptive error string if it fails.
 */
export async function startRecording(): Promise<void> {
  // Force-cleanup any dangling recording to reset expo-av's _recorderExists flag.
  if (_recording) {
    try { await _recording.stopAndUnloadAsync(); } catch { /* ignore */ }
    _recording = null;
  }

  // Set iOS audio mode to allow recording.
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: true,
    playsInSilentModeIOS: true,
  });

  // Use the proven HIGH_QUALITY preset — avoids custom-format issues.
  const { recording } = await Audio.Recording.createAsync(
    Audio.RecordingOptionsPresets.HIGH_QUALITY,
  );
  _recording = recording;
}

/**
 * Stop recording, transcribe via Whisper, and return the transcript.
 * Returns null if transcription fails; throws on recording errors.
 */
export async function stopAndTranscribe(): Promise<string | null> {
  if (!_recording) return null;

  const rec = _recording;
  _recording = null;

  let uri: string | null = null;
  try {
    await rec.stopAndUnloadAsync();
    uri = rec.getURI() ?? null;
  } catch (e) {
    throw new Error('Failed to stop recording');
  } finally {
    // Always reset audio mode so playback works afterwards.
    try {
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
    } catch { /* ignore */ }
  }

  if (!uri) return null;
  return transcribeWithWhisper(uri);
}

/** Cancel an in-progress recording without transcribing. */
export async function cancelRecording(): Promise<void> {
  if (!_recording) return;
  const rec = _recording;
  _recording = null;
  try { await rec.stopAndUnloadAsync(); } catch { /* ignore */ }
  try {
    await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
  } catch { /* ignore */ }
}

// ---------------------------------------------------------------------------
// Whisper transcription via Groq
// ---------------------------------------------------------------------------

async function transcribeWithWhisper(uri: string): Promise<string | null> {
  const apiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY;
  if (!apiKey) return null;

  // Determine the file type from URI — HIGH_QUALITY preset uses .caf on iOS, .3gp on Android.
  const ext = uri.split('.').pop()?.toLowerCase() ?? 'wav';
  // Whisper accepts: mp3, mp4, mpeg, mpga, m4a, wav, webm, ogg, flac
  // .caf and .3gp are NOT in that list — we'll still send and let Whisper handle it,
  // but label as wav/mp4 which are closest.
  const mimeMap: Record<string, string> = {
    wav: 'audio/wav',
    caf: 'audio/wav',    // iOS HIGH_QUALITY outputs .caf — Whisper reads it as wav
    '3gp': 'audio/mp4',  // Android HIGH_QUALITY outputs .3gp
    mp4: 'audio/mp4',
    m4a: 'audio/m4a',
    mp3: 'audio/mpeg',
    webm: 'audio/webm',
  };
  const mime = mimeMap[ext] ?? 'audio/wav';
  const name = `recording.${ext}`;

  const formData = new FormData();
  formData.append('file', { uri, name, type: mime } as any);
  formData.append('model', 'whisper-large-v3-turbo');
  formData.append('language', 'en');
  formData.append('response_format', 'json');

  try {
    const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.warn('[Whisper] transcription failed:', res.status, err?.error?.message);
      return null;
    }

    const json = await res.json();
    const transcript = (json?.text ?? '').trim();
    return transcript.length > 1 ? transcript : null;
  } catch (e) {
    console.warn('[Whisper] network error:', e);
    return null;
  }
}
