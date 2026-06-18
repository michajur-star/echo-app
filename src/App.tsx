import React, { useState, useEffect, useRef } from 'react';
import { 
  Heart, 
  Play, 
  Pause,
  SkipForward,
  SkipBack,
  Volume2, 
  VolumeX, 
  Sparkles, 
  Activity, 
  Sliders, 
  Music, 
  Info, 
  AlertCircle,
  HelpCircle,
  ListMusic,
  Disc,
  Radio,
  Search,
  Check,
  TrendingUp,
  Share2
} from 'lucide-react';

// Decoded Spotify Track list structure 
interface RealSongTrack {
  id: string; // 1-5
  title: string;
  artist: string;
  album: string;
  duration: string;
  approxBpm: string;
  reason: string;
}

// Initial Preset for 124 BPM (Workout Mode default)
interface DecodedSoundscape {
  bpm: number;
  zoneLabel: string;
  playlistName: string;
  playlistDescription: string;
  songs: RealSongTrack[];
  note?: string;
}

const INITIAL_PRESCRIPTION: DecodedSoundscape = {
  bpm: 124,
  zoneLabel: 'Training-Zone',
  playlistName: 'Aerobic Kinetic Drive (Focus)',
  playlistDescription: 'Treibender Puls für intensive Fokussierung, rhythmische Bewegung und Cardio-Motivation.',
  songs: [
    {
      id: '1',
      title: 'Don\'t Start Now',
      artist: 'Dua Lipa',
      album: 'Future Nostalgia',
      duration: '3:03',
      approxBpm: '124 BPM',
      reason: 'Die fette, spritzige Nu-Disco-Basslinie hält deine Schrittfrequenz ideal synchronisiert bei 124 BPM.'
    },
    {
      id: '2',
      title: 'One More Time',
      artist: 'Daft Punk',
      album: 'Discovery',
      duration: '5:20',
      approxBpm: '123 BPM',
      reason: 'Der absolute Meilenstein der French-House-Kultur. Hält deine Arbeits- oder Sportenergie konstant hoch.'
    },
    {
      id: '3',
      title: 'Marea (We\'ve Lost Dancing)',
      artist: 'Fred again.. & The Blessed Madonna',
      album: 'Actual Life',
      duration: '4:45',
      approxBpm: '123 BPM',
      reason: 'Perfekte rhythmische Wellen und schwebende Synths liefern pure Euphorie für deine Muskulatur.'
    },
    {
      id: '4',
      title: 'HUMBLE.',
      artist: 'Kendrick Lamar',
      album: 'DAMN.',
      duration: '2:57',
      approxBpm: '150 BPM (Half-time: 75)',
      reason: 'Der wuchtige, tiefe Piano-Basslauf mobilisiert mentale Entschlossenheit und Ausdauer beim Training.'
    },
    {
      id: '5',
      title: 'Lose Yourself',
      artist: 'Eminem',
      album: '8 Mile Soundtrack',
      duration: '5:26',
      approxBpm: '172 BPM (Half: 86)',
      reason: 'Kult-Motivationstrack. Die unermüdlich treibende Power-Gitarre pusht die Adrenalin-Zirkulation.'
    }
  ]
};

export default function App() {
  // Biometric & Selection controls state
  const [bpm, setBpm] = useState<number>(124);
  const [selectedMood, setSelectedMood] = useState<'Chill' | 'Focus' | 'Workout' | 'Party'>('Focus');
  const [customPrompt, setCustomPrompt] = useState<string>('');
  
  // Playlist & Loading system
  const [playlist, setPlaylist] = useState<DecodedSoundscape>(INITIAL_PRESCRIPTION);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showHelper, setShowHelper] = useState<boolean>(false);

  // Spotify Mock Player Player controls (Visual only - keeps audio silent!)
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [trackProgressSeconds, setTrackProgressSeconds] = useState<number>(12);
  const [volume, setVolume] = useState<number>(75);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [likedSongIds, setLikedSongIds] = useState<string[]>(['1', '3']);

  // Calculate Heart Zone segments
  const getZoneMeta = (pulse: number) => {
    if (pulse < 60) {
      return {
        label: 'Ruhe-Zone',
        desc: 'Tiefe Regeneration & Entlastung',
        color: 'text-sky-400',
        borderColor: 'border-sky-500/30',
        bgGlow: 'rgba(56, 189, 248, 0.15)',
        badgeClass: 'bg-sky-950/50 border border-sky-800 text-sky-400'
      };
    } else if (pulse >= 60 && pulse < 100) {
      return {
        label: 'Fokus-Zone',
        desc: 'Konzentriertes Lernen & Deep Work',
        color: 'text-[#FF2D55]',
        borderColor: 'border-[#FF2D55]/30',
        bgGlow: 'rgba(255, 45, 85, 0.15)',
        badgeClass: 'bg-[#FF2D55]/10 border border-[#FF2D55]/30 text-[#FF2D55]'
      };
    } else if (pulse >= 100 && pulse < 140) {
      return {
        label: 'Training-Zone',
        desc: 'Ausdauertraining & Cardio-Flow',
        color: 'text-amber-500',
        borderColor: 'border-amber-500/30',
        bgGlow: 'rgba(245, 158, 11, 0.15)',
        badgeClass: 'bg-amber-950/50 border border-amber-800 text-amber-500'
      };
    } else {
      return {
        label: 'Maximal-Zone',
        desc: 'Anaerobe Sprints & Peak-Power',
        color: 'text-red-500',
        borderColor: 'border-red-500/30',
        bgGlow: 'rgba(239, 68, 68, 0.15)',
        badgeClass: 'bg-red-950/50 border border-red-800 text-red-500'
      };
    }
  };

  const currentZone = getZoneMeta(bpm);
  const activeTrack = playlist.songs[currentTrackIndex] || playlist.songs[0] || null;

  // 1. Simulated playback progress bar hook
  useEffect(() => {
    let timer: any = null;
    if (isPlaying && activeTrack) {
      // Parse track length "m:ss" to total seconds
      const parts = activeTrack.duration.split(':');
      const maxSeconds = parts.length === 2 ? parseInt(parts[0]) * 60 + parseInt(parts[1]) : 180;

      timer = setInterval(() => {
        setTrackProgressSeconds((prev) => {
          if (prev >= maxSeconds) {
            // Auto transition to next track on complete
            handleNextTrack();
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isPlaying, currentTrackIndex, playlist]);

  // Handle Track Skipping
  const handleNextTrack = () => {
    setTrackProgressSeconds(0);
    setCurrentTrackIndex((prev) => (prev + 1) % playlist.songs.length);
  };

  const handlePrevTrack = () => {
    setTrackProgressSeconds(0);
    setCurrentTrackIndex((prev) => (prev - 1 + playlist.songs.length) % playlist.songs.length);
  };

  const togglePlayState = () => {
    setIsPlaying(!isPlaying);
  };

  const toggleLikeSong = (songId: string) => {
    if (likedSongIds.includes(songId)) {
      setLikedSongIds(likedSongIds.filter(id => id !== songId));
    } else {
      setLikedSongIds([...likedSongIds, songId]);
    }
  };

  // 2. Fetch Curated Music recommendations from Gemini endpoint
  const handleGeneratePlaylist = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const response = await fetch('/api/generate-soundscape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bpm: bpm,
          mood: selectedMood,
          customPrompt: customPrompt
        })
      });

      if (!response.ok) {
        throw new Error(`Fehler bei der Kommunikation mit dem Server: ${response.statusText}`);
      }

      const data: DecodedSoundscape = await response.json();
      if (data && data.songs && data.songs.length > 0) {
        setPlaylist(data);
        setCurrentTrackIndex(0);
        setTrackProgressSeconds(0);
        setIsPlaying(true); // Auto start simulated player visualizers
      } else {
        throw new Error('Ungültiges Antwortformat vom Server erhalten.');
      }
    } catch (err: any) {
      console.error('API Error during search:', err);
      setErrorMsg(err.message || 'Die biometrische Song-Kuration ist fehlgeschlagen. Offline-Standardwerte geladen.');
    } finally {
      setIsLoading(false);
    }
  };

  // Convert track time seconds for Spotify display e.g. "0:25"
  const formatSeconds = (totalSec: number) => {
    const minutes = Math.floor(totalSec / 60);
    const seconds = totalSec % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // Helper calculation for progress percentages
  const getProgressPercentage = () => {
    if (!activeTrack) return 0;
    const parts = activeTrack.duration.split(':');
    const totalSeconds = parts.length === 2 ? parseInt(parts[0]) * 60 + parseInt(parts[1]) : 180;
    return Math.min(100, (trackProgressSeconds / totalSeconds) * 100);
  };

  return (
    <div id="spotify-echo-root" className="min-h-screen bg-[#080B14] text-white flex flex-col font-sans selection:bg-[#FF2D55] selection:text-white relative">
      
      {/* Decorative Blur Background elements */}
      <div className="absolute top-0 right-0 w-[450px] h-[450px] bg-[#FF2D55]/5 rounded-full filter blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-20 left-10 w-[350px] h-[350px] bg-sky-500/5 rounded-full filter blur-[100px] pointer-events-none"></div>
      
      {/* Top Main Navigation Header */}
      <nav id="branding-header" className="px-6 md:px-12 py-5 flex justify-between items-center border-b border-white/5 bg-[#0a0e1a]/85 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#FF2D55] flex items-center justify-center shadow-lg shadow-[#FF2D55]/20 hover:scale-105 transition-all">
            <Radio className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-black tracking-wider uppercase text-white flex items-center gap-1.5">
              Echo <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-gray-400 capitalize font-medium font-mono">V2</span>
            </span>
            <span className="text-[10px] text-[#FF2D55] uppercase tracking-widest font-bold">Biometrischer Spotify-Kurator</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            id="helper-info-toggle"
            onClick={() => setShowHelper(!showHelper)}
            className="p-2.5 rounded-full border border-white/10 hover:border-[#FF2D55]/50 text-gray-400 hover:text-white transition-all hover:bg-white/5"
            title="So funktioniert Echo"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
          
          <button id="premium-ad-badge" className="hidden sm:inline-flex px-5 py-2 rounded-full bg-gradient-to-r from-[#FF2D55] to-amber-500 text-[10px] font-black hover:opacity-90 transition-all font-mono tracking-wider uppercase shadow-md pointer-events-none">
            Echo Premium Active
          </button>
        </div>
      </nav>

      {/* Manual Helper / Quick Tutorial Panel */}
      {showHelper && (
        <div id="quick-instructions" className="mx-6 md:mx-12 mt-6 p-5 bg-[#121624] border border-[#FF2D55]/30 rounded-2xl relative animate-fadeIn z-10">
          <button 
            onClick={() => setShowHelper(false)}
            className="absolute top-4 right-4 text-xs text-gray-400 hover:text-white font-mono"
          >
            [Schließen ×]
          </button>
          <h4 className="text-[#FF2D55] font-black text-xs uppercase tracking-widest mb-2 flex items-center gap-2">
            <Info className="w-4.5 h-4.5" /> Wie steuert sich dein biometrischer Musik-Kanal?
          </h4>
          <p className="text-xs text-gray-300 leading-relaxed max-w-4xl">
            1. Verstelle den <strong>BPM-Puls-Slider</strong>, um deine sportliche oder mentale Herzschlagfrequenz auszuwählen.<br />
            2. Wähle die gewünschte <strong>Stimmung</strong> aus (Chill für Entlastung, Focus für tiefere Schreibarbeiten, Workout für Energie, Party für maximale Beats).<br />
            3. Gib bei Bedarf <strong>Zusatzwünsche</strong> ein, um das Musikgenre oder Epochen einzuschränken (z. B. <i>&quot;Nur 90er Hip Hop&quot;</i> oder <i>&quot;Hauptsächlich weiche Gitarren-Akkorde&quot;</i>).<br />
            4. Klicke auf <strong>&quot;Playlist generieren&quot;</strong>, um Gemini Echtzeitempfehlungen echter Künstler laden zu lassen. Drücke danach auf die Tracks, um sie im simulierten Spotify-Player visuell abzuspielen!
          </p>
        </div>
      )}

      {/* Main Structural Area */}
      <div id="curator-viewport" className="flex-1 flex flex-col px-6 md:px-12 py-8 max-w-7xl mx-auto w-full gap-8">
        
        {/* Dynamic Premium Header Hero */}
        <div id="brand-curator-hero" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-[#0d101a] p-6 md:p-8 rounded-3xl border border-white/5 relative overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(#ff2d5509_1px,transparent_1px)] [background-size:20px_20px] opacity-40"></div>
          
          <div className="lg:col-span-7 z-10 flex flex-col justify-center">
            <div className="inline-block px-3 py-1 rounded-full bg-[#FF2D55]/10 border border-[#FF2D55]/20 text-[#FF2D55] text-[10px] font-black mb-4 uppercase tracking-widest max-w-fit">
              AI Playlist Intelligence
            </div>
            
            <h1 className="text-3xl md:text-5xl font-black leading-tight mb-3 tracking-tight uppercase text-white">
              Dein Puls. <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF2D55] to-orange-500 filter drop-shadow-[0_0_15px_rgba(255,45,85,0.2)]">Deine Playlist.</span>
            </h1>
            
            <p className="text-gray-400 text-xs md:text-sm leading-relaxed max-w-xl">
              Echo analysiert deine Herzfrequenz und kombiniert sie mit der Leistung von Gemini AI, um dich mit deinen Lieblingsalben und 5 exakt abgestimmten, echten Song-Empfehlungen legendärer Musiker zu verbinden. Synchronisiere Bewegung und Alltag ohne fiktive Störgeräusche.
            </p>
          </div>

          {/* Realistic Equalizer Audio Pulsator Component with custom zone display */}
          <div className="lg:col-span-5 flex flex-col justify-center bg-black/35 rounded-2xl border border-white/5 p-5 relative overflow-hidden h-44">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-mono tracking-widest text-gray-500 uppercase">Biometrisches Status-Gitter</span>
              <span className={`text-[10px] font-mono tracking-widest uppercase flex items-center gap-1.5 ${currentZone.color}`}>
                <span className="w-2 h-2 rounded-full bg-current animate-ping"></span>
                Herfrequenz: {bpm} BPM
              </span>
            </div>
            
            {/* Spotify Audio EQ Visualization Bars */}
            <div className="flex items-end justify-center gap-1.5 h-16 w-full px-4 mb-3">
              <div className="w-2 bg-[#FF2D55] rounded-t transition-all duration-300" style={{ height: isPlaying ? '90%' : '15%', animation: isPlaying ? 'eqPulse 1.2s ease-in-out infinite alternate' : 'none', animationDelay: '0.1s' }}></div>
              <div className="w-2 bg-[#FF2D55] rounded-t transition-all duration-300" style={{ height: isPlaying ? '50%' : '15%', animation: isPlaying ? 'eqPulse 0.8s ease-in-out infinite alternate' : 'none', animationDelay: '0.4s' }}></div>
              <div className="w-2 bg-rose-500 rounded-t transition-all duration-300" style={{ height: isPlaying ? '100%' : '15%', animation: isPlaying ? 'eqPulse 1.4s ease-in-out infinite alternate' : 'none', animationDelay: '0.2s' }}></div>
              <div className="w-2 bg-rose-500 rounded-t transition-all duration-300" style={{ height: isPlaying ? '70%' : '15%', animation: isPlaying ? 'eqPulse 0.9s ease-in-out infinite alternate' : 'none', animationDelay: '0.5s' }}></div>
              <div className="w-2 bg-orange-500 rounded-t transition-all duration-300" style={{ height: isPlaying ? '40%' : '15%', animation: isPlaying ? 'eqPulse 1.1s ease-in-out infinite alternate' : 'none', animationDelay: '0.3s' }}></div>
              <div className="w-2 bg-orange-500 rounded-t transition-all duration-300" style={{ height: isPlaying ? '85%' : '15%', animation: isPlaying ? 'eqPulse 1.3s ease-in-out infinite alternate' : 'none', animationDelay: '0.1s' }}></div>
              <div className="w-2 bg-emerald-500 rounded-t transition-all duration-300" style={{ height: isPlaying ? '60%' : '15%', animation: isPlaying ? 'eqPulse 0.7s ease-in-out infinite alternate' : 'none', animationDelay: '0.6s' }}></div>
              <div className="w-2 bg-emerald-500 rounded-t transition-all duration-300" style={{ height: isPlaying ? '95%' : '15%', animation: isPlaying ? 'eqPulse 1.5s ease-in-out infinite alternate' : 'none', animationDelay: '0.2s' }}></div>
              <div className="w-2 bg-sky-500 rounded-t transition-all duration-300" style={{ height: isPlaying ? '35%' : '15%', animation: isPlaying ? 'eqPulse 1.0s ease-in-out infinite alternate' : 'none', animationDelay: '0.4s' }}></div>
              <div className="w-2 bg-sky-500 rounded-t transition-all duration-300" style={{ height: isPlaying ? '75%' : '15%', animation: isPlaying ? 'eqPulse 1.2s ease-in-out infinite alternate' : 'none', animationDelay: '0.3s' }}></div>
            </div>

            <div className="flex justify-between items-center border-t border-white/5 pt-2">
              <span className="text-[10px] text-gray-500 font-mono">ZONE: {currentZone.label.toUpperCase()}</span>
              <span className="text-[10px] text-gray-400 font-bold">{currentZone.desc}</span>
            </div>
          </div>
        </div>

        {/* Global Keyframe CSS overrides for EQ and animations */}
        <style>{`
          @keyframes eqPulse {
            0% { transform: scaleY(0.15); }
            100% { transform: scaleY(1); }
          }
          @keyframes cdRotate {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .animate-cd {
            animation: cdRotate 12s linear infinite;
          }
        `}</style>

        {/* SYSTEM CONTROLLER WORKSPACE CARD PANEL */}
        <div id="echo-core-workspace" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT: HEART STATE MODES & CONTROLLERS (7 cols) */}
          <div id="controller-deck" className="lg:col-span-7 flex flex-col gap-6">
            
            {/* BPM Slider Deck Container */}
            <div id="bpm-slider-deck" className="p-6 md:p-8 rounded-3xl bg-[#121624] border border-white/5 flex flex-col">
              
              <div className="flex justify-between items-end mb-6">
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-gray-500 font-black block mb-1">Simulierter Atem &amp; Puls</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black font-mono tracking-tighter text-white">{bpm}</span>
                    <span className="text-gray-400 uppercase tracking-widest text-[#FF2D55] text-xs font-black">BPM</span>
                  </div>
                </div>
                
                <span className={`text-xs font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider ${currentZone.badgeClass}`}>
                  {currentZone.label}
                </span>
              </div>

              {/* Slider Input with Heart Rate tracker track styling */}
              <div className="relative my-4 flex items-center">
                <input 
                  id="pulse-bpm-slider"
                  type="range" 
                  min="40" 
                  max="200" 
                  value={bpm} 
                  onChange={(e) => setBpm(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-800 rounded-lg appearance-none accent-[#FF2D55] cursor-pointer"
                />
              </div>

              {/* Slider scale limits labeled in German as instructed */}
              <div className="flex justify-between mt-1 text-[10px] text-gray-500 uppercase font-black tracking-widest font-mono">
                <span className={bpm < 60 ? 'text-sky-400 font-bold' : ''}>Ruhe (40–59)</span>
                <span className={(bpm >= 60 && bpm < 100) ? 'text-[#FF2D55] font-bold' : ''}>Fokus (60–99)</span>
                <span className={(bpm >= 100 && bpm < 140) ? 'text-amber-500 font-bold' : ''}>Training (100–139)</span>
                <span className={bpm >= 140 ? 'text-red-500 font-bold' : ''}>Max (140-200)</span>
              </div>

            </div>

            {/* AI Custom Filter Settings Card */}
            <div id="song-customization-settings" className="p-6 md:p-8 rounded-3xl bg-[#121624] border border-white/5 flex flex-col gap-5">
              
              <div>
                <h3 className="font-extrabold text-gray-100 uppercase tracking-widest text-xs mb-1.5 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-[#FF2D55]" />
                  Stimmungs-Kur &amp; Musik-Palette
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Passe deinen Musikgeschmack an. Gemini webt diese Parameter in die Song-Verschreibung ein.
                </p>
              </div>

              {/* 4 Mood buttons of Chilli, Focus, Workout, Party */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {(['Chill', 'Focus', 'Workout', 'Party'] as const).map((m) => {
                  const getMoodDesc = (item: string) => {
                    if (item === 'Chill') return 'Entlastend, relaxed';
                    if (item === 'Focus') return 'Kognitiv, fließend';
                    if (item === 'Workout') return 'Energisch, treibend';
                    return 'Maximaler Bass, Club';
                  };
                  return (
                    <button
                      id={`mood-option-${m}`}
                      type="button"
                      key={m}
                      onClick={() => setSelectedMood(m)}
                      className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                        selectedMood === m 
                          ? 'bg-white/[0.03] border-[#FF2D55] shadow-lg shadow-[#FF2D55]/5' 
                          : 'bg-transparent border-white/5 hover:border-white/20'
                      }`}
                    >
                      <span 
                        className="text-xs font-black leading-none uppercase tracking-wider"
                        style={{ color: selectedMood === m ? '#FF2D55' : 'white' }}
                      >
                        {m}
                      </span>
                      <span className="text-[9px] text-gray-500 leading-tight">
                        {getMoodDesc(m)}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Custom Prompt instruction parameter input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] text-gray-400 font-black uppercase tracking-wider flex items-center gap-1">
                  <Search className="w-3.5 h-3.5 text-gray-500" />
                  Zusätzlicher Kurations-Filter (z. B. Genrebegrenzung)
                </label>
                <textarea 
                  id="music-customization-prompt"
                  placeholder="Z. B.: 'Nur 90s Grunge & Nu-Metal', 'Ausschließlich sanfter Indie-Folk', 'Elektronische Vocal Synth-Tracks'..."
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-xl p-3.5 text-xs text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-[#FF2D55] transition-all min-h-[70px] resize-none font-sans"
                />
              </div>

              {/* Action Trigger Button for Gemini */}
              <button 
                id="generate-spotify-playlist"
                onClick={handleGeneratePlaylist}
                disabled={isLoading}
                className="w-full bg-[#FF2D55] text-white py-4 px-6 rounded-xl font-bold flex items-center justify-center gap-2.5 cursor-pointer hover:opacity-95 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#FF2D55]/20 font-sans tracking-wider uppercase text-xs"
              >
                <Sparkles className="w-4 h-4 text-white" />
                {isLoading ? 'Analysiere Musik-Katalog...' : 'Playlist generieren'}
              </button>

            </div>

            {/* Error notifications */}
            {errorMsg && (
              <div id="error-banner" className="p-4 bg-red-950/40 border border-red-900 text-red-400 rounded-2xl flex items-center gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <div className="text-xs font-semibold">{errorMsg}</div>
              </div>
            )}

            {/* Curated Playlist Header details Info Block */}
            <div id="playlist-header-meta" className="p-6 rounded-3xl bg-[#121624] border border-white/5 flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-mono tracking-widest text-gray-500 uppercase">Aktuelles Rezept</span>
                <span className="text-[10px] font-bold text-[#FF2D55] uppercase tracking-wider bg-[#FF2D55]/10 px-2 py-0.5 rounded">Biometric Curated</span>
              </div>
              <h2 className="text-xl font-black text-white uppercase tracking-tight">
                {playlist.playlistName}
              </h2>
              <p className="text-xs text-gray-400 leading-relaxed bg-white/[0.01] p-3 rounded-xl border border-white/5">
                {playlist.playlistDescription}
              </p>
            </div>

          </div>

          {/* RIGHT: SPOTIFY-LIKE TRACK PLAYER LIST (5 cols) */}
          <div id="playback-deck" className="lg:col-span-5 flex flex-col gap-6 w-full">
            
            {/* MOCK SPOTIFY CASSETTE PLAYER DECK */}
            {activeTrack && (
              <div id="interactive-cassette-deck" className="bg-[#121624] rounded-3xl p-6 border border-white/5 flex flex-col items-center relative overflow-hidden shadow-2xl">
                
                {/* Accent glow on top header of player */}
                <div className="absolute top-0 inset-x-0 h-1.5" style={{ backgroundColor: '#FF2D55' }} />

                <div className="w-full flex justify-between items-center mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#FF2D55] animate-ping"></div>
                    <span className="text-[9px] font-mono tracking-widest text-[#FF2D55] uppercase font-bold">Now Playing</span>
                  </div>
                  <span className="text-[9px] font-mono text-gray-500 uppercase font-black">PULSMATCH: {activeTrack.approxBpm}</span>
                </div>

                {/* Spinning physical CD Graphic */}
                <div className="my-6 relative w-36 h-36 flex items-center justify-center">
                  <div className={`w-36 h-36 rounded-full bg-gradient-to-br from-[#1d2030] via-black to-[#131622] border-2 border-white/10 flex items-center justify-center shadow-2xl ${isPlaying ? 'animate-cd' : ''}`}>
                    <div className="w-14 h-14 rounded-full bg-[#080B14] border-4 border-white/5 flex items-center justify-center">
                      <div className="w-4 h-4 rounded-full bg-[#FF2D55]"></div>
                    </div>
                  </div>
                  <Disc className="w-5 h-5 absolute text-white/20 animate-pulse pointer-events-none" />
                </div>

                {/* Details text area for active simulated track */}
                <div className="text-center w-full px-2">
                  <h3 className="font-extrabold text-[#FF2D55] text-base truncate uppercase">{activeTrack.title}</h3>
                  <p className="text-xs text-gray-200 font-bold mt-1 tracking-tight">{activeTrack.artist}</p>
                  <p className="text-[10px] text-gray-500 italic mt-0.5 font-mono">{activeTrack.album}</p>
                </div>

                {/* Simulated playback tracking timelines progress slider */}
                <div className="w-full mt-6">
                  <div className="w-full bg-gray-800 h-1 rounded-full relative overflow-hidden cursor-pointer" onClick={() => setTrackProgressSeconds(Math.floor(Math.random() * 60))}>
                    <div 
                      className="bg-[#FF2D55] h-full rounded-full transition-all duration-300"
                      style={{ width: `${getProgressPercentage()}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-mono text-gray-500 mt-2">
                    <span>{formatSeconds(trackProgressSeconds)}</span>
                    <span className="lowercase">approx. {activeTrack.duration}</span>
                  </div>
                </div>

                {/* Player button controls row */}
                <div className="flex items-center justify-center gap-6 mt-4 w-full">
                  <button 
                    onClick={handlePrevTrack}
                    className="p-2 text-gray-400 hover:text-white transition-all hover:bg-white/5 rounded-full cursor-pointer"
                    title="Vorheriger Titel"
                  >
                    <SkipBack className="w-5 h-5" />
                  </button>

                  <button 
                    onClick={togglePlayState}
                    className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg cursor-pointer"
                    title={isPlaying ? 'Pausieren' : 'Abspielen'}
                  >
                    {isPlaying ? <Pause className="w-5 h-5 fill-black stroke-black" /> : <Play className="w-5 h-5 fill-black stroke-black ml-0.5" />}
                  </button>

                  <button 
                    onClick={handleNextTrack}
                    className="p-2 text-gray-400 hover:text-white transition-all hover:bg-white/5 rounded-full cursor-pointer"
                    title="Nächster Titel"
                  >
                    <SkipForward className="w-5 h-5" />
                  </button>
                </div>

                {/* Premium tactile feedback reason panel explanation */}
                <div className="mt-5 pt-4 w-full border-t border-white/5 bg-black/20 p-3 rounded-xl">
                  <span className="text-[9px] font-black tracking-widest text-[#FF2D55] uppercase block mb-1">KI-Auswahlbegründung</span>
                  <p className="text-[11px] text-gray-300 leading-relaxed font-sans">
                    {activeTrack.reason}
                  </p>
                </div>

              </div>
            )}

            {/* THE TRACK-LIST OVERVIEW DECK */}
            <div id="curated-soundtrack-list" className="p-6 rounded-3xl bg-[#121624] border border-white/5 flex flex-col gap-4 relative">
              
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <ListMusic className="w-4.5 h-4.5 text-[#FF2D55]" />
                  <h3 className="font-extrabold text-xs uppercase tracking-widest text-gray-200">
                    5 Biometrische Song-Empfehlungen
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-gray-500 tracking-tighter uppercase font-bold">
                  {playlist.songs.length} Titel weichgefiltert
                </span>
              </div>

              {/* The generated list of 5 real songs */}
              <div className="flex flex-col gap-2.5">
                {playlist.songs.map((track, i) => {
                  const isCurrent = i === currentTrackIndex;
                  return (
                    <div 
                      key={track.id}
                      onClick={() => {
                        setCurrentTrackIndex(i);
                        setTrackProgressSeconds(0);
                        setIsPlaying(true);
                      }}
                      className={`p-3 rounded-xl border flex items-center justify-between transition-all group cursor-pointer ${
                        isCurrent 
                          ? 'bg-white/[0.04] border-[#FF2D55] shadow-sm' 
                          : 'bg-transparent border-white/5 hover:border-white/10 hover:bg-white/[0.01]'
                      }`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        
                        {/* Audio status indicator box */}
                        <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center flex-shrink-0 text-gray-400 group-hover:bg-[#FF2D55]/10 group-hover:text-[#FF2D55] transition-all">
                          {isCurrent && isPlaying ? (
                            <div className="flex gap-0.5 items-end justify-center w-4 h-4">
                              <span className="w-1 bg-[#FF2D55] h-3 animate-pulse"></span>
                              <span className="w-1 bg-[#FF2D55] h-4 animate-pulse" style={{ animationDelay: '0.2s' }}></span>
                              <span className="w-1 bg-[#FF2D55] h-2 animate-pulse" style={{ animationDelay: '0.4s' }}></span>
                            </div>
                          ) : (
                            <span className="text-xs font-mono font-black">{i + 1}</span>
                          )}
                        </div>

                        {/* Text fields */}
                        <div className="flex flex-col min-w-0">
                          <span className={`text-xs font-black truncate leading-tight ${isCurrent ? 'text-[#FF2D55]' : 'text-gray-100'}`}>
                            {track.title}
                          </span>
                          <span className="text-[10px] text-gray-500 truncate mt-0.5">
                            {track.artist} <span className="text-gray-600">•</span> Album: <i className="text-gray-400">{track.album}</i>
                          </span>
                        </div>

                      </div>

                      {/* Right information side: song limits duration and BPM badge */}
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="text-[9px] font-mono text-gray-500 bg-white/5 px-2 py-0.5 rounded text-center">
                          {track.approxBpm}
                        </span>
                        
                        <button 
                          id={`song-like-btn-${track.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleLikeSong(track.id);
                          }}
                          className={`p-1 hover:scale-110 transition-all ${likedSongIds.includes(track.id) ? 'text-[#FF2D55]' : 'text-gray-600 hover:text-gray-400'}`}
                          title="Titel favorisieren"
                        >
                          <Heart className="w-4 h-4 fill-current" />
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>

              {/* Status loader overlay during Gemini computation block execution */}
              {isLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 bg-black/90 rounded-3xl border border-[#FF2D55]/40 backdrop-blur-sm z-50">
                  <div className="relative w-10 h-10 flex items-center justify-center">
                    <div className="absolute w-10 h-10 border-4 border-[#FF2D55]/30 border-t-[#FF2D55] rounded-full animate-spin"></div>
                    <Radio className="w-4.5 h-4.5 text-[#FF2D55] animate-pulse" />
                  </div>
                  <div className="text-center">
                    <span className="text-xs font-black text-[#FF2D55] tracking-widest uppercase block animate-pulse">Suche Songs...</span>
                    <span className="text-[10px] text-gray-400 block mt-1.5 max-w-[280px] mx-auto leading-relaxed">
                      Lese aktuelle Biometrie aus und kuratiere 5 echte Tracks bekannter Künstler über das Gemini AI-Modell.
                    </span>
                  </div>
                </div>
              )}

            </div>

          </div>

        </div>

      </div>

      {/* Mini footer branding element */}
      <footer id="branding-footer" className="mt-auto px-6 md:px-12 py-6 flex flex-col sm:flex-row justify-between items-center border-t border-white/5 text-[10px] uppercase tracking-widest text-gray-600 gap-4 bg-[#05070d]">
        <div>© 2026 Design Prototype - Echo Audio Intelligence X Spotify API</div>
        <div className="flex gap-6">
          <span className="hover:text-[#FF2D55] cursor-pointer transition-colors">Vision</span>
          <span className="hover:text-[#FF2D55] cursor-pointer transition-colors">Terms of Service</span>
          <span className="hover:text-[#FF2D55] cursor-pointer transition-colors">BPM Logic Guide</span>
        </div>
      </footer>

    </div>
  );
}
