export enum VoiceGender {
  MALE = 'Hombre',
  FEMALE = 'Mujer',
  BOY = 'Niño',
  GIRL = 'Niña',
  CUSTOM = 'Personalizada'
}

export enum Region {
  ES = 'España',
  MX = 'México',
  AR = 'Argentina',
  LATAM = 'Latinoamérica Neutro'
}

export enum VoiceStyle {
  NATURAL = 'Natural',
  HAPPY = 'Alegre',
  SAD = 'Triste',
  WHISPER = 'Susurrado',
  STORYTELLER = 'Storyteller'
}

export enum Speed {
  SLOW = 'Lento',
  MEDIUM = 'Medio',
  FAST = 'Rápido'
}

export enum Pitch {
  LOW = 'Grave',
  MEDIUM_LOW = 'Medio Grave',
  MEDIUM = 'Medio',
  MEDIUM_HIGH = 'Medio Agudo',
  HIGH = 'Agudo'
}

export interface VoiceOption {
  id: string;
  name: string;
  gender: VoiceGender;
  baseModelVoice: string; // Mapping to Gemini prebuilt voices (Puck, Charon, Kore, Fenrir, Zephyr)
  isCustom?: boolean;
}

export interface AudioHistoryItem {
  id: string;
  text: string;
  audioUrl: string; // Blob URL
  timestamp: number;
  config: {
    voiceName: string;
    style: VoiceStyle;
    region: Region;
  };
}

export interface GenerationConfig {
  text: string;
  voiceId: string;
  region: Region;
  style: VoiceStyle;
  speed: Speed;
  pitch: Pitch;
}