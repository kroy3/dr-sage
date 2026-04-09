/**
 * Voice service using expo-audio (SDK 54) + expo-speech.
 *
 * expo-av is DEPRECATED in SDK 54 — this uses the new expo-audio package.
 * AudioRecorder API: create instance → prepareToRecordAsync → record() → stop() → uri
 */

import {
  AudioRecorder,
  requestRecordingPermissionsAsync,
  getRecordingPermissionsAsync,
  RecordingPresets,
  setAudioModeAsync,
} from 'expo-audio';
import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

export type RecordingState = 'idle' | 'recording' | 'processing';

// ─────────────────────────────────────────────────────────────────────────────
// TTS — expo-speech
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Stop any current speech then speak the given text.
 * Speech.stop() is async — must be awaited to avoid race conditions.
 */
export async function speakText(text: string, onDone?: () => void): Promise<void> {
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
    rate: Platform.OS === 'ios' ? 0.50 : 0.88,
    onDone,
    onStopped: onDone,
    onError: () => onDone?.(),
  });
}

export async function stopSpeaking(): Promise<void> {
  try { await Speech.stop(); } catch { /* ignore */ }
}

// ─────────────────────────────────────────────────────────────────────────────
// Permissions
// ─────────────────────────────────────────────────────────────────────────────

export async function getMicPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    const { granted } = await getRecordingPermissionsAsync();
    return granted;
  } catch { return false; }
}

export async function requestMicPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    const { granted } = await requestRecordingPermissionsAsync();
    return granted;
  } catch { return false; }
}

// ─────────────────────────────────────────────────────────────────────────────
// Recording — expo-audio AudioRecorder
// ─────────────────────────────────────────────────────────────────────────────

let _recorder: AudioRecorder | null = null;

export async function startRecording(): Promise<void> {
  // Clean up any previous recorder
  if (_recorder) {
    try {
      if (_recorder.isRecording) await _recorder.stop();
    } catch { /* ignore */ }
    _recorder = null;
  }

  // Set audio mode for recording
  try {
    await setAudioModeAsync({
      playsInSilentMode: true,
      allowsRecording: true,
      interruptionMode: 'mixWithOthers',
    });
  } catch { /* ignore — proceed anyway */ }

  // Create and prepare recorder with HIGH_QUALITY preset
  const recorder = new AudioRecorder(RecordingPresets.HIGH_QUALITY);
  await recorder.prepareToRecordAsync();
  recorder.record();
  _recorder = recorder;
}

export async function stopAndTranscribe(): Promise<string | null> {
  if (!_recorder) return null;
  const recorder = _recorder;
  _recorder = null;

  try {
    await recorder.stop();
    const uri = recorder.uri;
    if (!uri) return null;
    return await transcribeWithWhisper(uri);
  } catch (e) {
    console.warn('[Voice] stopAndTranscribe error:', e);
    return null;
  } finally {
    try {
      await setAudioModeAsync({ playsInSilentMode: false, allowsRecording: false });
    } catch { /* ignore */ }
  }
}

export async function cancelRecording(): Promise<void> {
  if (!_recorder) return;
  const recorder = _recorder;
  _recorder = null;
  try {
    if (recorder.isRecording) await recorder.stop();
  } catch { /* ignore */ }
  try {
    await setAudioModeAsync({ playsInSilentMode: false, allowsRecording: false });
  } catch { /* ignore */ }
}

// ─────────────────────────────────────────────────────────────────────────────
// Whisper transcription via Groq
// ─────────────────────────────────────────────────────────────────────────────

async function transcribeWithWhisper(uri: string): Promise<string | null> {
  const apiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY;
  if (!apiKey) { console.warn('[Whisper] No API key'); return null; }

  // Map file extension to a MIME type Whisper accepts
  const ext = uri.split('.').pop()?.toLowerCase() ?? 'wav';
  const mimeMap: Record<string, string> = {
    wav: 'audio/wav', caf: 'audio/wav',
    '3gp': 'audio/mp4', mp4: 'audio/mp4',
    m4a: 'audio/m4a', mp3: 'audio/mpeg',
    webm: 'audio/webm', ogg: 'audio/ogg',
  };
  const mime = mimeMap[ext] ?? 'audio/wav';

  const formData = new FormData();
  formData.append('file', { uri, name: `rec.${ext}`, type: mime } as any);
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
      console.warn('[Whisper] Error:', res.status, err?.error?.message);
      return null;
    }
    const json = await res.json();
    const text = (json?.text ?? '').trim();
    return text.length > 1 ? text : null;
  } catch (e) {
    console.warn('[Whisper] Network error:', e);
    return null;
  }
}
