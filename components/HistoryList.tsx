import React, { useRef, useState } from 'react';
import { AudioHistoryItem } from '../types';
import { Icons } from './Icon';

interface HistoryListProps {
  history: AudioHistoryItem[];
  onDelete: (id: string) => void;
}

const HistoryList: React.FC<HistoryListProps> = ({ history, onDelete }) => {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handlePlay = (item: AudioHistoryItem) => {
    if (playingId === item.id && audioRef.current) {
      audioRef.current.pause();
      setPlayingId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const audio = new Audio(item.audioUrl);
      audio.onended = () => setPlayingId(null);
      audioRef.current = audio;
      audio.play();
      setPlayingId(item.id);
    }
  };

  const handleDownload = (item: AudioHistoryItem) => {
    const a = document.createElement('a');
    a.href = item.audioUrl;
    // We use .wav because the file generated is a WAV container wrapping the PCM data.
    // This ensures it plays correctly in all media players.
    a.download = `voz-viva-${item.timestamp}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (history.length === 0) {
    return (
      <div className="text-center py-10 text-slate-500">
        <Icons.History className="w-12 h-12 mx-auto mb-3 opacity-20" />
        <p>Aún no has generado ningún audio.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
        <Icons.History className="w-5 h-5 text-indigo-400" />
        Historial Reciente
      </h3>
      <div className="space-y-3">
        {history.map((item) => (
          <div key={item.id} className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 flex items-center justify-between hover:border-indigo-500/30 transition-all">
            <div className="flex-1 min-w-0 mr-4">
              <p className="text-sm text-slate-300 truncate font-medium">{item.text}</p>
              <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                <span className="bg-slate-700 px-2 py-0.5 rounded text-slate-300">{item.config.voiceName}</span>
                <span>{item.config.style}</span>
                <span>{item.config.region}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => handlePlay(item)}
                className={`p-2 rounded-full transition-colors ${playingId === item.id ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                title={playingId === item.id ? "Pausar" : "Reproducir"}
              >
                {playingId === item.id ? <Icons.Pause className="w-4 h-4" /> : <Icons.Play className="w-4 h-4" />}
              </button>
              
              <button 
                onClick={() => handleDownload(item)}
                className="p-2 bg-slate-700 text-slate-300 rounded-full hover:bg-slate-600 transition-colors"
                title="Descargar Audio (WAV)"
              >
                <Icons.Download className="w-4 h-4" />
              </button>

              <button 
                onClick={() => onDelete(item.id)}
                className="p-2 bg-transparent text-slate-600 rounded-full hover:text-red-400 transition-colors"
                title="Eliminar"
              >
                <Icons.Delete className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HistoryList;