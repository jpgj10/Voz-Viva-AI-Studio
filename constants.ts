import { Region, Speed, Pitch, VoiceGender, VoiceOption, VoiceStyle } from "./types";

// We map our 12 virtual voices to the 5 available Gemini prebuilt voices.
// We will use System Instructions to further differentiate "Boy" vs "Man" or "Girl" vs "Woman".
export const VOICES: VoiceOption[] = [
  // Hombres (5)
  { id: 'm1', name: 'Alejandro', gender: VoiceGender.MALE, baseModelVoice: 'Fenrir' },
  { id: 'm2', name: 'Carlos', gender: VoiceGender.MALE, baseModelVoice: 'Charon' }, // Deeper
  { id: 'm3', name: 'Miguel', gender: VoiceGender.MALE, baseModelVoice: 'Puck' },
  { id: 'm4', name: 'Javier', gender: VoiceGender.MALE, baseModelVoice: 'Zephyr' },
  { id: 'm5', name: 'Fernando', gender: VoiceGender.MALE, baseModelVoice: 'Fenrir' },
  
  // Mujeres (5)
  { id: 'f1', name: 'Sofía', gender: VoiceGender.FEMALE, baseModelVoice: 'Kore' }, // Softer
  { id: 'f2', name: 'Valentina', gender: VoiceGender.FEMALE, baseModelVoice: 'Kore' }, // Replaced 'Aoede' with 'Kore' to avoid API errors
  { id: 'f3', name: 'Isabella', gender: VoiceGender.FEMALE, baseModelVoice: 'Kore' },
  { id: 'f4', name: 'Camila', gender: VoiceGender.FEMALE, baseModelVoice: 'Kore' },
  { id: 'f5', name: 'Lucía', gender: VoiceGender.FEMALE, baseModelVoice: 'Kore' },

  // Niños (2)
  { id: 'b1', name: 'Mateo', gender: VoiceGender.BOY, baseModelVoice: 'Puck' }, // Higher pitch via instruction
  { id: 'g1', name: 'Emma', gender: VoiceGender.GIRL, baseModelVoice: 'Kore' }  // Higher pitch via instruction
];

// Fallback logic: Ensure we map to valid API voice names: 'Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'
// Also handles finding custom voices if passed in the full list context, but this helper is mainly for static mapping
export const getGeminiVoiceName = (id: string, allVoices: VoiceOption[] = VOICES): string => {
  const v = allVoices.find(v => v.id === id);
  return v ? v.baseModelVoice : 'Puck';
};

export const REGIONS = Object.values(Region);
export const STYLES = Object.values(VoiceStyle);
export const SPEEDS = Object.values(Speed);
export const PITCHES = Object.values(Pitch);

export const TAG_HELP_TEXT = `
Etiquetas soportadas:
[pausa] - Silencio de 2 segundos
[risa] - Risa breve
[grito] - Exclamación enérgica
[llanto] - Tono emotivo/quebrado
[susurro] - Voz muy baja y suave
`;