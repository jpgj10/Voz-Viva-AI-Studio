import { GoogleGenAI, Modality } from "@google/genai";
import { GenerationConfig, VoiceOption } from "../types";

// Helper: Convert Base64 string to Uint8Array
const base64ToUint8Array = (base64String: string): Uint8Array => {
  const binaryString = atob(base64String);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

// Helper: Write String to DataView
const writeString = (view: DataView, offset: number, string: string) => {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
};

// Helper: Add WAV Header to Raw PCM Data
const addWavHeader = (pcmData: Uint8Array, sampleRate: number = 24000, numChannels: number = 1): ArrayBuffer => {
  const headerLength = 44;
  const dataLength = pcmData.length;
  const buffer = new ArrayBuffer(headerLength + dataLength);
  const view = new DataView(buffer);

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataLength, true);

  const pcmBytes = new Uint8Array(buffer, headerLength);
  pcmBytes.set(pcmData);

  return buffer;
};

export const generateSpeech = async (config: GenerationConfig, allVoices: VoiceOption[]): Promise<Blob> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key no encontrada. Por favor configura tu entorno.");
  }

  const ai = new GoogleGenAI({ apiKey });

  // Select the appropriate base model voice from the combined list (static + custom)
  const voiceInfo = allVoices.find(v => v.id === config.voiceId);
  const geminiVoiceName = voiceInfo ? voiceInfo.baseModelVoice : 'Puck';
  
  // Advanced Prompt Engineering for Tags
  // To get the model to perform sounds instead of reading them, we treat the text as a script with stage directions.
  const promptText = `
    [INSTRUCCIONES DEL SISTEMA]
    Rol: Actor de doblaje profesional.
    Personaje: ${voiceInfo?.name} (Género: ${voiceInfo?.gender}).
    Acento: Español de ${config.region}.
    
    [CONFIGURACIÓN DE AUDIO]
    Estilo: ${config.style}
    Velocidad: ${config.speed}
    Tono: ${config.pitch}
    
    [REGLAS CRÍTICAS DE INTERPRETACIÓN]
    1. El texto entre corchetes, por ejemplo [risa], [pausa], [llanto], [susurro], [grito], son ACOTACIONES (didascalias).
    2. NO LEAS el texto dentro de los corchetes.
    3. EJECUTA el sonido o la emoción que indican.
       - Si dice [risa], ríete naturalmente.
       - Si dice [pausa], haz silencio por 2 segundos.
       - Si dice [susurro], susurra la frase siguiente.
       - Si dice [grito], exclama con fuerza.
    
    [GUIÓN A LEER]
    "${config.text}"
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{
        parts: [{ text: promptText }],
      }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: geminiVoiceName,
            },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) {
      throw new Error("No se generó audio. Intenta simplificar el texto o las etiquetas.");
    }

    const pcmData = base64ToUint8Array(base64Audio);
    const wavBuffer = addWavHeader(pcmData, 24000, 1);

    return new Blob([wavBuffer], { type: 'audio/wav' });

  } catch (error) {
    console.error("Error generating speech:", error);
    throw error;
  }
};