import { useEffect, useRef, useCallback } from 'react';
import { PitchDetector } from 'pitchy';

const FFT_SIZE = 2048; // how many audio samples to analyse per frame
const MIN_CLARITY = 0.8; // how clear the pitch detection must be to consider it valid
const MIN_RMS = 0.01; // how loud the audio must be to consider it valid
const MIN_FREQUENCY = 82; // lowest frequency to detect (E2)
const MAX_FREQUENCY = 1319; // highest frequency to detect (E6)

export function frequencyToNoteName(freq: number): string {
  const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const MIDI = Math.round(12 * Math.log2(freq / 440)) + 69;
  const octave = Math.floor(MIDI / 12) - 1;
  const name= NOTE_NAMES[MIDI % 12];
  return `${name}${octave}`;
}

export function frequencyToTuner(freq: number): { note: string, cents: number } | null {
  const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const EXACT_MIDI = 12 * Math.log2(freq / 440) + 69;
  const MIDI = Math.round(EXACT_MIDI);
  const cents = Math.round((EXACT_MIDI - MIDI) * 100);
  const octave = Math.floor(MIDI / 12) - 1;
  const name = NOTE_NAMES[MIDI % 12];
  return { note: `${name}${octave}`, cents };
}

export function usePitchDetector(onNote: (note:string, freq: number, clarity: number) => void) {
  const rafRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const contextRef = useRef<AudioContext | null>(null);

  const start = useCallback(async () =>{
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const context = new AudioContext();
    const source = context.createMediaStreamSource(stream);
    const analyser = context.createAnalyser();
    analyser.fftSize = FFT_SIZE;
    source.connect(analyser);

    streamRef.current = stream;
    contextRef.current = context;

    const buffer = new Float32Array(FFT_SIZE);
    const detector = PitchDetector.forFloat32Array(FFT_SIZE);

    const loop = () => {
      analyser.getFloatTimeDomainData(buffer);
      
      const rms = Math.sqrt(buffer.reduce((sum, val) => sum + val * val, 0) / buffer.length);
      console.log('rms:', rms);
      if (rms >= MIN_RMS) {
        const [frequency, clarity] = detector.findPitch(buffer, context.sampleRate);
        if (clarity >= MIN_CLARITY && frequency >= MIN_FREQUENCY && frequency <= MAX_FREQUENCY) {
          onNote(frequencyToNoteName(frequency), frequency, clarity);
        }
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  }, [onNote]);

  const stop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }
    streamRef.current?.getTracks().forEach(track => track.stop());
    contextRef.current?.close();
  }, []);

  useEffect(() => () => stop(), [stop]);

  return { start, stop };
}