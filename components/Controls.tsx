import React, { useState, useRef, useEffect } from 'react';
import { Region, Speed, Pitch, VoiceStyle, VoiceGender, VoiceOption } from '../types';
import { REGIONS, STYLES, SPEEDS, PITCHES } from '../constants';
import { Icons } from './Icon';

interface ControlsProps {
  voices: VoiceOption[];
  selectedVoiceId: string;
  setSelectedVoiceId: (id: string) => void;
  selectedRegion: Region;
  setSelectedRegion: (r: Region) => void;
  selectedStyle: VoiceStyle;
  setSelectedStyle: (s: VoiceStyle) => void;
  selectedSpeed: Speed;
  setSelectedSpeed: (s: Speed) => void;
  selectedPitch: Pitch;
  setSelectedPitch: (p: Pitch) => void;
  onAddCustomVoice: (name: string, baseModelVoice: string) => void;
  onPreviewVoice: (voiceId: string) => void;
  disabled: boolean;
}

const Controls: React.FC<ControlsProps> = ({
  voices,
  selectedVoiceId,
  setSelectedVoiceId,
  selectedRegion,
  setSelectedRegion,
  selectedStyle,
  setSelectedStyle,
  selectedSpeed,
  setSelectedSpeed,
  selectedPitch,
  setSelectedPitch,
  onAddCustomVoice,
  onPreviewVoice,
  disabled
}) => {
  const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'naming'>('idle');
  const [tempName, setTempName] = useState('');
  const [detectedPitchFreq, setDetectedPitchFreq] = useState<number>(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Analyze audio to find dominant frequency (pitch approximation)
  const analyzePitch = () => {
    if (!analyserRef.current) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Find bin with max value
    let maxVal = -1;
    let maxIndex = -1;
    for (let i = 0; i < bufferLength; i++) {
      if (dataArray[i] > maxVal) {
        maxVal = dataArray[i];
        maxIndex = i;
      }
    }

    // Convert bin to frequency
    // Freq = index * sampleRate / fftSize
    const sampleRate = audioContextRef.current?.sampleRate || 44100;
    const fftSize = analyserRef.current.fftSize;
    const frequency = maxIndex * sampleRate / fftSize;

    // Smooth update slightly only if significant sound
    if (maxVal > 100) { 
        setDetectedPitchFreq(prev => (prev * 0.8) + (frequency * 0.2));
    }
    
    animationFrameRef.current = requestAnimationFrame(analyzePitch);
  };

  const getBestMatchingBaseVoice = (frequency: number): string => {
    // Basic frequency mapping logic
    // Male: ~85-180Hz
    // Female: ~165-255Hz
    // Child: >250Hz
    
    if (frequency < 130) return 'Charon'; // Deep Male
    if (frequency < 190) return 'Fenrir'; // Standard Male
    if (frequency < 250) return 'Kore';   // Female
    return 'Puck';                        // Child/High
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      // Setup Audio Context for Analysis
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioCtx;
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      analyserRef.current = analyser;
      
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      
      // Start Analysis Loop
      analyzePitch();

      // Setup Recorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setRecordingState('recording');
      setDetectedPitchFreq(0); // Reset

      mediaRecorder.onstop = () => {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        if (audioContextRef.current) {
          audioContextRef.current.close();
        }
      };
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("No se pudo acceder al micrófono.");
      setRecordingState('idle');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recordingState === 'recording') {
      mediaRecorderRef.current.stop();
      setRecordingState('naming');
    }
  };

  const handleSaveVoice = () => {
    if (tempName.trim()) {
      const bestMatch = getBestMatchingBaseVoice(detectedPitchFreq);
      onAddCustomVoice(tempName.trim(), bestMatch);
      setTempName('');
      setRecordingState('idle');
    }
  };

  const handleCancelSave = () => {
    setTempName('');
    setRecordingState('idle');
  };

  const groupedVoices = voices.reduce((acc, voice) => {
    const groupKey = voice.isCustom ? 'Mis Voces (Personalizadas)' : voice.gender;
    if (!acc[groupKey]) acc[groupKey] = [];
    acc[groupKey].push(voice);
    return acc;
  }, {} as Record<string, VoiceOption[]>);

  const labelClass = "block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider";
  const selectClass = "w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:border-indigo-500/50";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6 bg-slate-900/50 rounded-xl border border-slate-800 relative overflow-hidden">
      
      {/* Recording Overlay */}
      {recordingState === 'recording' && (
         <div className="absolute inset-0 bg-slate-900/95 z-20 flex flex-col items-center justify-center animate-in fade-in duration-200">
           <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4 relative">
             <div className="w-8 h-8 bg-red-500 rounded-full animate-pulse"></div>
             {detectedPitchFreq > 0 && (
                <div className="absolute -bottom-8 text-xs text-red-400 font-mono">
                  {Math.round(detectedPitchFreq)} Hz
                </div>
             )}
           </div>
           <p className="text-white font-medium mb-2">Escuchando tono de voz...</p>
           <p className="text-slate-400 text-xs mb-4 max-w-xs text-center">
             Analizamos tu tono para encontrar la voz base más parecida.
           </p>
           <button 
             onClick={stopRecording}
             className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-full font-bold transition-colors shadow-lg shadow-red-600/20"
           >
             Detener y Analizar
           </button>
         </div>
      )}

      {/* Naming Overlay */}
      {recordingState === 'naming' && (
         <div className="absolute inset-0 bg-slate-900/95 z-20 flex flex-col items-center justify-center animate-in fade-in duration-200 px-6">
           <h3 className="text-white font-medium mb-2">¡Tono detectado!</h3>
           <p className="text-slate-400 text-xs mb-4">
             Frecuencia media: {Math.round(detectedPitchFreq)} Hz<br/>
             Modelo base asignado: <span className="text-indigo-400 font-mono">{getBestMatchingBaseVoice(detectedPitchFreq)}</span>
           </p>
           <div className="w-full max-w-xs space-y-3">
             <label className="text-xs text-slate-400 uppercase tracking-wide">Nombre de tu voz</label>
             <input 
               type="text" 
               value={tempName}
               onChange={(e) => setTempName(e.target.value)}
               placeholder="Ej: Mi Voz Narrador"
               className="w-full bg-slate-800 border border-indigo-500/50 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
               autoFocus
               onKeyDown={(e) => e.key === 'Enter' && handleSaveVoice()}
             />
             <div className="flex gap-2">
               <button 
                 onClick={handleCancelSave}
                 className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-200 py-2 rounded-lg text-sm font-medium transition-colors"
               >
                 Cancelar
               </button>
               <button 
                 onClick={handleSaveVoice}
                 disabled={!tempName.trim()}
                 className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-indigo-600/20"
               >
                 Guardar
               </button>
             </div>
           </div>
         </div>
      )}

      {/* Voice Selector with Record Button */}
      <div className="col-span-1 md:col-span-2 lg:col-span-1">
        <div className="flex justify-between items-center mb-1">
          <label className={labelClass}>Voz</label>
          <button 
            onClick={startRecording}
            disabled={disabled || recordingState !== 'idle'}
            className="text-[10px] bg-indigo-900/50 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-800 px-2 py-0.5 rounded flex items-center gap-1 transition-all"
            title="Clonar mi tono de voz"
          >
            <Icons.Mic className="w-3 h-3" />
            <span>Grabar/Clonar</span>
          </button>
        </div>
        <div className="flex gap-2">
            <div className="flex-1">
                <select 
                value={selectedVoiceId} 
                onChange={(e) => setSelectedVoiceId(e.target.value)}
                className={selectClass}
                disabled={disabled}
                >
                {Object.entries(groupedVoices).map(([groupName, groupVoices]) => (
                    <optgroup key={groupName} label={groupName}>
                    {groupVoices.map((voice) => (
                        <option key={voice.id} value={voice.id}>
                        {voice.name} {voice.isCustom && '(Custom)'}
                        </option>
                    ))}
                    </optgroup>
                ))}
                </select>
            </div>
            <button
                onClick={() => onPreviewVoice(selectedVoiceId)}
                disabled={disabled}
                className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-indigo-400 p-2.5 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50"
                title="Escuchar Demo de Voz"
            >
                <Icons.Volume className="w-5 h-5" />
            </button>
        </div>
      </div>

      {/* Region Selector */}
      <div>
        <label className={labelClass}>Acento / Región</label>
        <select 
          value={selectedRegion} 
          onChange={(e) => setSelectedRegion(e.target.value as Region)}
          className={selectClass}
          disabled={disabled}
        >
          {REGIONS.map((region) => (
            <option key={region} value={region}>{region}</option>
          ))}
        </select>
      </div>

      {/* Style Selector */}
      <div>
        <label className={labelClass}>Estilo</label>
        <select 
          value={selectedStyle} 
          onChange={(e) => setSelectedStyle(e.target.value as VoiceStyle)}
          className={selectClass}
          disabled={disabled}
        >
          {STYLES.map((style) => (
            <option key={style} value={style}>{style}</option>
          ))}
        </select>
      </div>

      {/* Speed Selector */}
      <div>
        <label className={labelClass}>Velocidad</label>
        <select 
          value={selectedSpeed} 
          onChange={(e) => setSelectedSpeed(e.target.value as Speed)}
          className={selectClass}
          disabled={disabled}
        >
          {SPEEDS.map((speed) => (
            <option key={speed} value={speed}>{speed}</option>
          ))}
        </select>
      </div>

      {/* Pitch Selector */}
      <div>
        <label className={labelClass}>Tono</label>
        <select 
          value={selectedPitch} 
          onChange={(e) => setSelectedPitch(e.target.value as Pitch)}
          className={selectClass}
          disabled={disabled}
        >
          {PITCHES.map((pitch) => (
            <option key={pitch} value={pitch}>{pitch}</option>
          ))}
        </select>
      </div>

    </div>
  );
};

export default Controls;