// Utilities for handling PCM Audio Data for Gemini Live API

export function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Convert raw Float32 microphone input to 16-bit PCM Base64 string for Gemini
export function convertFloat32To16BitPCMBase64(float32Array: Float32Array): string {
  const len = float32Array.length;
  const int16Array = new Int16Array(len);
  
  for (let i = 0; i < len; i++) {
    // Clamp values to [-1, 1] then scale to 16-bit integer range
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  
  return uint8ArrayToBase64(new Uint8Array(int16Array.buffer));
}

// Decode Base64 PCM16 audio from Gemini to an AudioBuffer for playback
export async function decodeAudioData(
  base64String: string,
  ctx: AudioContext,
  sampleRate: number = 24000
): Promise<AudioBuffer> {
  const bytes = base64ToUint8Array(base64String);
  const dataInt16 = new Int16Array(bytes.buffer);
  
  // Create an AudioBuffer (1 channel for now as Live API standard)
  const buffer = ctx.createBuffer(1, dataInt16.length, sampleRate);
  const channelData = buffer.getChannelData(0);
  
  for (let i = 0; i < dataInt16.length; i++) {
    // Convert 16-bit int back to float [-1, 1]
    channelData[i] = dataInt16[i] / 32768.0;
  }
  
  return buffer;
}