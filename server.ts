import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  app.use(express.json());

  // Initialize Gemini client on the server
  const apiKey = process.env.GEMINI_API_KEY;
  let ai: GoogleGenAI | null = null;
  if (apiKey) {
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } else {
    console.warn('WARNING: GEMINI_API_KEY is not defined in the environment. Falling back to local high-quality song database.');
  }

  // API endpoint to generate high-quality Spotify-like real song recommendations
  app.post('/api/generate-soundscape', async (req, res) => {
    try {
      const { bpm, mood, customPrompt } = req.body;

      if (!ai) {
        // Fallback local response if AI client is missing (robust mock using real known artists!)
        const localSongs = getLocalSongFallback(bpm, mood, customPrompt);
        return res.json({
          ...localSongs,
          note: 'Offline-Modus aktiv. Trage deinen GEMINI_API_KEY in die Secrets ein, um dynamische neuronale Playlists live zu weben!'
        });
      }

      // Categorize BPM into clear heart zones
      let zone = 'Ruhe';
      let zoneDesc = 'Ruhige Herzfrequenz, ideal zur mentalen Regeneration, Entspannung oder zum Schlaf.';
      if (bpm < 60) {
        zone = 'Ruhe (Rest)';
        zoneDesc = 'Langsamer Puls für totale Entlastung, Erholung und stressfreie Gedanken.';
      } else if (bpm >= 60 && bpm < 100) {
        zone = 'Fokus (Focus)';
        zoneDesc = 'Konzentriertes Tempo für tiefe kognitive Aufmerksamkeit, Lernen und produktives Arbeiten.';
      } else if (bpm >= 100 && bpm < 140) {
        zone = 'Training (Workout)';
        zoneDesc = 'Aktives aerobes Tempo für Fitness, Bewegung und Ausdauerbelastung.';
      } else {
        zone = 'Maximal-Bereich (Peak)';
        zoneDesc = 'Intense anaerobe Leistungsgrenze für hocheffektive Intervalle, Sprints und maximale Motivation.';
      }

      const systemPrompt = `Du bist EchoPlaylistAI, ein renommierter Musik-Katalog-Kurator, Algorithmus-Designer für Streamingdienste und Experte für biometrische Akustikentwicklung.
Deine einzige Aufgabe ist es, für ein gegebenes Herzschlagtempo (BPM) und eine gewünschte Stimmung (Chill, Focus, Workout, Party) eine Playlist aus 5 absolut real existierenden Songs bekannter, weltberühmter Künstler (wie Billie Eilish, Kendrick Lamar, Radiohead, Daft Punk, Dua Lipa, Fred again.., Eminem, Hans Zimmer etc.) zusammenzustellen.
Verwende NIEMALS fiktive Frequenzbezeichnungen, Meditationsrauschen oder erfundene Songs.
Antworte AUSSCHLIESSLICH im puren JSON-Format ohne Markdown-Ummantelung (keine backticks \`\`\`json).`;

      const promptMsg = `Erstelle eine playlist mit genau 5 echten, berühmten Songs passend zu folgenden Parametern:
- Ziel-Tempo: ${bpm} BPM
- Ziel-Herzzone: ${zone} (${zoneDesc})
- Ausgewählte Stimmung / Mood: ${mood}
- Zusätzliche Wünsche / Custom-Prompt: ${customPrompt || 'Keine'}

Die Song-Empfehlungen müssen exakt existieren. Begründe kurz auf Deutsch (unter "reason"), warum genau dieser Song perfekt zu einem Puls von ${bpm} BPM und der Stimmung "${mood}" passt.

Bitte sende exakt folgendes JSON-Schema zurück:
{
  "bpm": ${bpm},
  "zoneLabel": "string" (z.B. "Ruhe-Zone", "Fokus-Zone", "Training-Zone", "Maximal-Zone"),
  "playlistName": "string" (Kreativer, stimmungsvoller Name für diese Playlist),
  "playlistDescription": "string" (Eine kurze Beschreibung des musikalischen Charakters auf Deutsch),
  "songs": [
    {
      "id": "string" (Zahl 1-5),
      "title": "string" (Echter Song-Titel),
      "artist": "string" (Echter weltbekannter Künstler),
      "album": "string" (Echtes Album oder Single, auf dem der Track erschien),
      "duration": "string" (z.B. "3:42"),
      "approxBpm": "string" (Das echte ungefähre Tempo des Songs, z.B. "122 BPM"),
      "reason": "string" (Kurze Erklärung auf Deutsch, warum dieser Track bei ${bpm} BPM und Stimmung "${mood}" optimal ist)
    }
  ]
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: promptMsg,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: 'application/json',
          temperature: 0.85,
        },
      });

      const responseText = response.text || '{}';
      const cleanJson = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsedData = JSON.parse(cleanJson);
      res.json(parsedData);
    } catch (e: any) {
      console.error('Error generating real song playlist via Gemini:', e);
      // Fallback
      const bpm = req.body.bpm || 80;
      const mood = req.body.mood || 'Chill';
      const fallbackData = getLocalSongFallback(bpm, mood, req.body.customPrompt);
      res.json({
        ...fallbackData,
        error: e.message || 'System failed to fetch AI response'
      });
    }
  });

  // Local fallback with real legendary tracks
  function getLocalSongFallback(bpm: number, mood: string, prompt?: string) {
    const selectedMood = mood || 'Chill';
    const cleanPrompt = prompt ? ` ("${prompt}")` : '';

    if (bpm < 60) {
      // Ruhe-Zone
      return {
        bpm: bpm,
        zoneLabel: 'Ruhe-Zone',
        playlistName: `Serotonin Slowdown (${selectedMood})`,
        playlistDescription: `Beruhigende, tiefgehende Songs für einen regenerativen Puls unter 60 BPM${cleanPrompt}. Ideal zum Runterkommen.`,
        songs: [
          {
            id: '1',
            title: 'Ocean Eyes',
            artist: 'Billie Eilish',
            album: 'dont smile at me',
            duration: '3:20',
            approxBpm: '58 BPM',
            reason: 'Die schwebenden, langsamen Pads und Billies intimer Gesang drosseln den Herzschlag auf ganz natürliche Weise.'
          },
          {
            id: '2',
            title: 'No Surprises',
            artist: 'Radiohead',
            album: 'OK Computer',
            duration: '3:49',
            approxBpm: '53 BPM',
            reason: 'Das Glockenspiel-Motiv und die sanfte Akustik-Gitarre schaffen eine meditative, nostalgische Entlastung.'
          },
          {
            id: '3',
            title: 'Intro',
            artist: 'The xx',
            album: 'xx',
            duration: '2:08',
            approxBpm: '60 BPM',
            reason: 'Minimalistischer Basslauf und gedehnte Gitarrenakzentuierungen sorgen für unmittelbaren Stressabbau.'
          },
          {
            id: '4',
            title: 'Time',
            artist: 'Hans Zimmer',
            album: 'Inception OST',
            duration: '4:35',
            approxBpm: '60 BPM',
            reason: 'Epischer, aber unglaublich sanft ansteigender Orchesteraufbau, der den Kopf vollkommen frei macht.'
          },
          {
            id: '5',
            title: 'Holocene',
            artist: 'Bon Iver',
            album: 'Bon Iver',
            duration: '5:36',
            approxBpm: '55 BPM',
            reason: 'Wunderschöne Folk-Gitarrenzupfmuster begünstigen tiefe Atemzüge und eine niedrige Herzfrequenz.'
          }
        ]
      };
    } else if (bpm >= 60 && bpm < 100) {
      // Fokus-Zone
      return {
        bpm: bpm,
        zoneLabel: 'Fokus-Zone',
        playlistName: `Deep Cognitive Flow (${selectedMood})`,
        playlistDescription: `Rhytmisch konstante, immersive Tracks für fokussiertes Arbeiten bei mittlerem Puls (60-99 BPM)${cleanPrompt}.`,
        songs: [
          {
            id: '1',
            title: 'Teardrop',
            artist: 'Massive Attack',
            album: 'Mezzanine',
            duration: '5:31',
            approxBpm: '77 BPM',
            reason: 'Das berühmte Herzschlag-Drum-Intrumental ist die ultimative akustische Blaupause für kognitive Höchstleistung.'
          },
          {
            id: '2',
            title: 'Reckoner',
            artist: 'Radiohead',
            album: 'In Rainbows',
            duration: '4:50',
            approxBpm: '74 BPM',
            reason: 'Flüssige Percussion-Rhythmen und warmer Background-Chor stützen die Konzentration über lange Programmier-Sitzungen.'
          },
          {
            id: '3',
            title: 'Something About Us',
            artist: 'Daft Punk',
            album: 'Discovery',
            duration: '3:51',
            approxBpm: '75 BPM',
            reason: 'Ein herrlich unaufgeregter, sanfter Synth-Beat, der Kreativität und einen optimalen Arbeitsfluss begünstigt.'
          },
          {
            id: '4',
            title: 'White Mercedes',
            artist: 'Lana Del Rey',
            album: 'Norman Fucking Rockwell!',
            duration: '3:21',
            approxBpm: '80 BPM',
            reason: 'Ein tragfähiger Rhythmus mit ruhigen Gesangsharmonien, der Ablenkungen im Raum konsequent dämpft.'
          },
          {
            id: '5',
            title: 'Coffee',
            artist: 'Sylvan Esso',
            album: 'Sylvan Esso',
            duration: '4:28',
            approxBpm: '84 BPM',
            reason: 'Ein kontinuierlich gleichbleibender Klick- und Synthesizer-Herzschlag, ideal für tiefes, fokussiertes Schreiben.'
          }
        ]
      };
    } else if (bpm >= 100 && bpm < 140) {
      // Training-Zone
      return {
        bpm: bpm,
        zoneLabel: 'Training-Zone',
        playlistName: `Aerobic Kinetic Drive (${selectedMood})`,
        playlistDescription: `Treibender Puls für schweißtreibende Workouts, Cardio-Flow und Fitness-Motivation bei 100-139 BPM${cleanPrompt}.`,
        songs: [
          {
            id: '1',
            title: 'HUMBLE.',
            artist: 'Kendrick Lamar',
            album: 'DAMN.',
            duration: '2:57',
            approxBpm: '150 BPM (Half-time: 75)',
            reason: 'Der knallharte, aggressive Klavier-Riff peitscht den sportlichen Ehrgeiz voran und synchronisiert energetische Wiederholungen.'
          },
          {
            id: '2',
            title: 'One More Time',
            artist: 'Daft Punk',
            album: 'Discovery',
            duration: '5:20',
            approxBpm: '123 BPM',
            reason: 'Der absolute King der treibenden 4-to-the-floor Club-Rhythmen. Hält deine Motivation auf einem konstant hohen Level.'
          },
          {
            id: '3',
            title: 'Don\'t Start Now',
            artist: 'Dua Lipa',
            album: 'Future Nostalgia',
            duration: '3:03',
            approxBpm: '124 BPM',
            reason: 'Die fette, spritzige Basslinie treibt die Schrittfrequenz beim Laufen oder Trainieren ideal an.'
          },
          {
            id: '4',
            title: 'Marea (We\'ve Lost Dancing)',
            artist: 'Fred again.. & The Blessed Madonna',
            album: 'Actual Life',
            duration: '4:45',
            approxBpm: '123 BPM',
            reason: 'Ein moderner House-Track mit euphorischen Speech-Samples, die dem Körper zusätzliche Ausdauer-Reserven entlocken.'
          },
          {
            id: '5',
            title: 'Lose Yourself',
            artist: 'Eminem',
            album: '8 Mile Soundtrack',
            duration: '5:26',
            approxBpm: '86 BPM (Double-time: 172)',
            reason: 'Diese energiegeladene Hymne treibt den inneren Fokus sowie die Muskelanspannung an die Leistungsgrenze.'
          }
        ]
      };
    } else {
      // Maximal-Bereich
      return {
        bpm: bpm,
        zoneLabel: 'Maximal-Zone',
        playlistName: `Peak Adrenaline Surge (${selectedMood})`,
        playlistDescription: `Maximale Tempogrenzen und kompromisslose rhythmische Intensität für Sprints bei über 140 BPM${cleanPrompt}.`,
        songs: [
          {
            id: '1',
            title: 'Till I Collapse',
            artist: 'Eminem',
            album: 'The Eminem Show',
            duration: '4:57',
            approxBpm: '171 BPM',
            reason: 'Der stampfende Militär-Beat zwingt dich förmlich, über deine eigenen Grenzen zu gehen, perfekt bei maximalem Herzfrequenz-Training.'
          },
          {
            id: '2',
            title: 'Bleed',
            artist: 'Meshuggah',
            album: 'obZen',
            duration: '7:22',
            approxBpm: '115 BPM (Extreme subdivision sync)',
            reason: 'Für die extremen Momente: Ein unaufhörlicher rhythmisscher Motorik-Hammer, der reinste Energie kanalisiert.'
          },
          {
            id: '3',
            title: 'Stronger',
            artist: 'Kanye West',
            album: 'Graduation',
            duration: '5:11',
            approxBpm: '104 BPM (Peak performance pace)',
            reason: 'Daft Punk Vocal-Cut gekoppelt mit ballerndem Hip-Hop Beat liefert die ultimative Attitüde für schwere Gewichte.'
          },
          {
            id: '4',
            title: 'Jungle',
            artist: 'Fred again..',
            album: 'Actual Life 3',
            duration: '3:18',
            approxBpm: '134 BPM',
            reason: 'Wuchtiger, hysterischer Rave-Track, der die Synapsen vollends auf Anschlag stellt.'
          },
          {
            id: '5',
            title: 'Level Up',
            artist: 'Ciara',
            album: 'Beauty Marks',
            duration: '3:24',
            approxBpm: '144 BPM',
            reason: 'Dieser schnelle Tanz-Pop-Rhythmus treibt die Schrittgeschwindigkeit auf Höchstwerte – absoluter Sprint-Booster.'
          }
        ]
      };
    }
  }

  // Serve Vite dev server middleware in development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });
    app.use(vite.middlewares);

    // Serve index.html for any unhandled routes
    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        let template = await vite.transformIndexHtml(url, `<!doctype html>
<html lang="de">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Echo - AI Spotify Playlist Kurator</title>
  </head>
  <body style="margin: 0; background-color: #080B14; color: white;">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    // Serve static files in production
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  const port = 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`Server is running at http://0.0.0.0:${port}`);
  });
}

startServer();
