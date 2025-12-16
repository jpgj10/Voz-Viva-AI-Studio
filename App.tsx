import React, { useState, useRef, useMemo } from 'react';
import { 
  VoiceGender, 
  Region, 
  VoiceStyle, 
  Speed, 
  Pitch, 
  AudioHistoryItem,
  VoiceOption
} from './types';
import { VOICES, TAG_HELP_TEXT } from './constants';
import { generateSpeech } from './services/geminiService';
import Controls from './components/Controls';
import HistoryList from './components/HistoryList';
import { Icons } from './components/Icon';

const App: React.FC = () => {
  // State for Configuration
  const [text, setText] = useState<string>("");
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>(VOICES[0].id);
  const [selectedRegion, setSelectedRegion] = useState<Region>(Region.ES);
  const [selectedStyle, setSelectedStyle] = useState<VoiceStyle>(VoiceStyle.NATURAL);
  const [selectedSpeed, setSelectedSpeed] = useState<Speed>(Speed.MEDIUM);
  const [selectedPitch, setSelectedPitch] = useState<Pitch>(Pitch.MEDIUM);

  // Custom Voices State
  const [customVoices, setCustomVoices] = useState<VoiceOption[]>([]);

  // Combine static voices with custom voices
  const allVoices = useMemo(() => {
    return [...VOICES, ...customVoices];
  }, [customVoices]);

  // State for UI/UX
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // State for History
  const [history, setHistory] = useState<AudioHistoryItem[]>([]);

  // Ref for textarea to manage cursor position
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Insert tag into text area at cursor position
  const insertTag = (tag: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setText((prev) => prev + " " + tag + " ");
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = textarea.value;

    // Insert tag at cursor position
    const newText = currentText.substring(0, start) + " " + tag + " " + currentText.substring(end);
    
    // Update state
    setText(newText);

    // Restore focus and cursor position after the tag
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + tag.length + 2; 
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleAddCustomVoice = (name: string, baseModelVoice: string) => {
    const newVoice: VoiceOption = {
      id: `custom-${Date.now()}`,
      name: name,
      gender: VoiceGender.CUSTOM,
      baseModelVoice: baseModelVoice, // Use the detected base voice
      isCustom: true
    };
    setCustomVoices(prev => [...prev, newVoice]);
    setSelectedVoiceId(newVoice.id); // Auto-select the new voice
  };

  const handlePreviewVoice = async (voiceId: string) => {
    setIsGenerating(true);
    setError(null);
    try {
        const voice = allVoices.find(v => v.id === voiceId);
        const demoText = `Hola, soy ${voice?.name || 'tu asistente'}. Así suena mi voz.`;
        
        const audioBlob = await generateSpeech({
            text: demoText,
            voiceId: voiceId,
            region: selectedRegion,
            style: VoiceStyle.NATURAL,
            speed: Speed.MEDIUM,
            pitch: Pitch.MEDIUM
        }, allVoices);

        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.play();

    } catch (err: any) {
        setError("Error al reproducir demo: " + (err.message || "Desconocido"));
    } finally {
        setIsGenerating(false);
    }
  };

  const handleGenerate = async () => {
    if (!text.trim()) {
      setError("Por favor escribe algo de texto.");
      return;
    }
    
    setIsGenerating(true);
    setError(null);

    try {
      // Pass allVoices so the service can find custom voice IDs
      const audioBlob = await generateSpeech({
        text,
        voiceId: selectedVoiceId,
        region: selectedRegion,
        style: selectedStyle,
        speed: selectedSpeed,
        pitch: selectedPitch
      }, allVoices);

      const audioUrl = URL.createObjectURL(audioBlob);
      const voiceName = allVoices.find(v => v.id === selectedVoiceId)?.name || 'Desconocido';

      const newItem: AudioHistoryItem = {
        id: Date.now().toString(),
        text: text.trim(),
        audioUrl,
        timestamp: Date.now(),
        config: {
          voiceName,
          style: selectedStyle,
          region: selectedRegion
        }
      };

      setHistory((prev) => [newItem, ...prev]);
    } catch (err: any) {
      setError(err.message || "Error generando audio. Verifica tu API Key o intenta más tarde.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteHistory = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  const tags = [
    { label: '[pausa]', title: 'Pausa de 2s' }, 
    { label: '[risa]', title: 'Risa natural' }, 
    { label: '[grito]', title: 'Exclamación fuerte' }, 
    { label: '[llanto]', title: 'Voz quebrada' },
    { label: '[susurro]', title: 'Voz muy baja' }
  ];

  return (
    <div className="min-h-screen bg-slate-950 pb-20">
      
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Icons.Volume className="text-white w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              VozViva AI Studio
            </h1>
          </div>
          <div className="text-xs text-slate-500 font-mono hidden sm:block">
            Powered by Gemini 2.5 Flash TTS
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        
        {/* Main Interface Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Input & Controls (8 columns) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Controls Panel */}
            <Controls 
              voices={allVoices}
              selectedVoiceId={selectedVoiceId}
              setSelectedVoiceId={setSelectedVoiceId}
              selectedRegion={selectedRegion}
              setSelectedRegion={setSelectedRegion}
              selectedStyle={selectedStyle}
              setSelectedStyle={setSelectedStyle}
              selectedSpeed={selectedSpeed}
              setSelectedSpeed={setSelectedSpeed}
              selectedPitch={selectedPitch}
              setSelectedPitch={setSelectedPitch}
              onAddCustomVoice={handleAddCustomVoice}
              onPreviewVoice={handlePreviewVoice}
              disabled={isGenerating}
            />

            {/* Text Input Area */}
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-1 shadow-xl">
              <div className="bg-slate-950 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2 flex-wrap gap-2">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Texto a convertir
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {tags.map(tag => (
                      <button 
                        key={tag.label}
                        onClick={() => insertTag(tag.label)}
                        disabled={isGenerating}
                        title={tag.title}
                        className="text-[11px] bg-slate-800 hover:bg-indigo-900/50 text-indigo-300 border border-slate-700 hover:border-indigo-700 px-2 py-1 rounded transition-colors"
                      >
                        {tag.label}
                      </button>
                    ))}
                  </div>
                </div>
                
                <textarea
                  ref={textareaRef}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Escribe aquí tu texto en español..."
                  className="w-full h-40 bg-transparent text-lg text-slate-200 placeholder-slate-600 focus:outline-none resize-none leading-relaxed"
                  disabled={isGenerating}
                />
                
                <div className="flex justify-between items-end mt-4 pt-4 border-t border-slate-800">
                  <p className="text-xs text-slate-600 hidden sm:block max-w-md">
                   Las etiquetas (ej: [risa]) serán interpretadas como acciones, no leídas.
                  </p>
                  
                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating || !text.trim()}
                    className={`
                      flex items-center gap-2 px-6 py-3 rounded-lg font-bold shadow-lg transition-all transform active:scale-95
                      ${isGenerating || !text.trim() 
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed shadow-none' 
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/25 hover:shadow-indigo-500/40'}
                    `}
                  >
                    {isGenerating ? (
                      <>
                        <Icons.Loading className="w-5 h-5 animate-spin" />
                        Generando...
                      </>
                    ) : (
                      <>
                        <Icons.Magic className="w-5 h-5" />
                        Generar Audio
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-900/20 border border-red-900/50 text-red-200 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                <span className="block w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                {error}
              </div>
            )}
          </div>

          {/* Right Column: History (4 columns) */}
          <div className="lg:col-span-4">
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 h-full min-h-[500px]">
              <HistoryList 
                history={history} 
                onDelete={handleDeleteHistory}
              />
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default App;