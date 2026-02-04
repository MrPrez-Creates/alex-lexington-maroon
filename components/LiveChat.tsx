
import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, FunctionDeclaration, Type } from '@google/genai';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { convertFloat32To16BitPCMBase64, decodeAudioData } from '../utils/audioUtils';
import { fetchChartHistory, HistoricalDataPoint } from '../services/marketData';
import { fetchMarketNews } from '../services/newsService';
import { calculateItemValue } from '../utils/calculations';
import { METAL_COLORS } from '../constants';
import { BullionItem, SpotPrices } from '../types';

interface LiveChatProps {
  onClose: () => void;
  inventory: BullionItem[];
  prices: SpotPrices;
  initialPrompt?: string; // Pre-filled prompt from suggestions
}

interface ChartState {
  metal: string;
  timeframe: string;
  data: HistoricalDataPoint[];
}

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  isFinal: boolean;
}

// Tool Definitions for Gemini
const historicalPricesTool: FunctionDeclaration = {
  name: "getHistoricalPrices",
  description: "Retrieve and display historical price data/charts for a precious metal. Use this when the user asks to see price history, trends, or charts.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      metal: { 
        type: Type.STRING, 
        description: "The metal name (Gold, Silver, Platinum, Palladium)." 
      },
      timeframe: { 
        type: Type.STRING, 
        description: "Time period for the chart (1D, 1W, 1M, 3M, 1Y, ALL). Defaults to 1M." 
      }
    },
    required: ["metal"]
  }
};

const marketNewsTool: FunctionDeclaration = {
  name: "getMarketNews",
  description: "Fetch the latest market news headlines for precious metals (Gold, Silver, Economy). Use this when asked about 'news', 'recent events', or reasons for market movement.",
  parameters: { type: Type.OBJECT, properties: {} }
};

export default function LiveChat({ onClose, inventory, prices, initialPrompt }: LiveChatProps) {
  const [status, setStatus] = useState<'connecting' | 'listening' | 'speaking' | 'error' | 'ready'>('connecting');
  const [errorMessage, setErrorMessage] = useState('');
  const [displayedChart, setDisplayedChart] = useState<ChartState | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [textInput, setTextInput] = useState('');
  const [isToolLoading, setIsToolLoading] = useState(false);
  const [toolLoadingMessage, setToolLoadingMessage] = useState('');
  
  // Audio Context Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  
  // Playback Refs
  const nextStartTimeRef = useRef<number>(0);
  const scheduledSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  
  // Gemini Client Ref
  const clientRef = useRef<GoogleGenAI | null>(null);
  const sessionRef = useRef<Promise<any> | null>(null);

  // Transcription Refs (Mutable buffers for streaming updates)
  const currentInputTransRef = useRef('');
  const currentOutputTransRef = useRef('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // System Prompt Construction
  const systemInstruction = `
    You are Maroon, the advanced AI concierge for Alex Lexington, a premier precious metals dealer based in Atlanta.
    Your voice is professional, knowledgeable, yet warm and concise (suitable for voice conversation).

    **Current Market Data (Real-time):**
    Gold: $${prices.gold?.toLocaleString()}
    Silver: $${prices.silver?.toLocaleString()}
    Platinum: $${prices.platinum?.toLocaleString()}
    Palladium: $${prices.palladium?.toLocaleString()}

    **User's Portfolio:**
    Total Value: $${inventory.reduce((acc, item) => acc + calculateItemValue(item, prices[item.metalType] || 0), 0).toLocaleString(undefined, {minimumFractionDigits: 2})}
    Item Count: ${inventory.length}
    Key Items: ${inventory.slice(0, 5).map(i => `${i.quantity}x ${i.name}`).join(', ')}${inventory.length > 5 ? '...' : ''}

    **Your Capabilities:**
    1. Analyze portfolio performance based on the data above.
    2. Provide real-time market updates and news (call getMarketNews tool).
    3. Discuss historical price trends (call getHistoricalPrices tool).
    4. Answer questions about specific coins (Eagles, Maples, Buffaloes) and bars.

    **About Alex Lexington:**
    - Trusted family-owned bullion dealer in Atlanta.
    - We buy and sell gold, silver, platinum, diamonds, and luxury watches.
    - We offer secure vault storage and insured shipping.

    **Rules:**
    - Keep answers short and conversational.
    - If asked about future prices, cite market news or trends, do not give financial advice.
    - If asked "How much do I have?", refer to the Portfolio Value provided above.
  `;

  // Start Session Function (Can be called automatically or manually)
  const startSession = async () => {
      setStatus('connecting');
      setErrorMessage('');
      setMessages([]);
      
      try {
        // 1. Initialize Audio Context
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContextClass({ sampleRate: 16000 }); // Input sample rate
        audioContextRef.current = ctx;

        // 2. Request Mic Permissions
        // Important: this usually requires a user gesture if not already granted.
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        inputStreamRef.current = stream;

        // 3. Initialize Gemini Client
        clientRef.current = new GoogleGenAI({ apiKey: process.env.API_KEY });

        // 4. Connect to Live API
        const sessionPromise = clientRef.current.live.connect({
          model: 'gemini-2.5-flash-native-audio-preview-09-2025',
          config: {
            responseModalities: [Modality.AUDIO],
            tools: [{ functionDeclarations: [historicalPricesTool, marketNewsTool] }],
            inputAudioTranscription: {}, // Enable user transcription
            outputAudioTranscription: {}, // Enable model transcription
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
            },
            systemInstruction: systemInstruction,
          },
          callbacks: {
            onopen: async () => {
              console.log("Gemini Live Connected");
              setStatus('listening');
              
              try {
                // Resume Context if suspended (browser policy)
                if (ctx.state === 'suspended') {
                    await ctx.resume();
                }

                if (!inputStreamRef.current) return;

                const source = ctx.createMediaStreamSource(inputStreamRef.current);
                sourceRef.current = source;
                
                const processor = ctx.createScriptProcessor(4096, 1, 1);
                processorRef.current = processor;
                
                processor.onaudioprocess = (e) => {
                  const inputData = e.inputBuffer.getChannelData(0);
                  const base64PCM = convertFloat32To16BitPCMBase64(inputData);
                  
                  // Send to Gemini
                  sessionPromise.then(session => {
                    session.sendRealtimeInput({
                      media: {
                        mimeType: 'audio/pcm;rate=16000',
                        data: base64PCM
                      }
                    });
                  });
                };
                
                const muteGain = ctx.createGain();
                muteGain.gain.value = 0;
                source.connect(processor);
                processor.connect(muteGain);
                muteGain.connect(ctx.destination);

              } catch (err) {
                console.error("Audio Pipeline Error:", err);
                setStatus('error');
                setErrorMessage("Audio stream initialization failed.");
              }
            },
            onmessage: async (message: LiveServerMessage) => {
              // --- Handle Transcription ---
              if (message.serverContent?.outputTranscription) {
                const text = message.serverContent.outputTranscription.text;
                currentOutputTransRef.current += text;
                
                // Update Model Message in UI
                setMessages(prev => {
                    const last = prev[prev.length - 1];
                    if (last && last.role === 'model' && !last.isFinal) {
                        return [...prev.slice(0, -1), { ...last, text: currentOutputTransRef.current }];
                    } else {
                        return [...prev, { id: Date.now().toString(), role: 'model', text: currentOutputTransRef.current, isFinal: false }];
                    }
                });
              } else if (message.serverContent?.inputTranscription) {
                const text = message.serverContent.inputTranscription.text;
                currentInputTransRef.current += text;
                
                // Update User Message in UI
                setMessages(prev => {
                    const last = prev[prev.length - 1];
                    if (last && last.role === 'user' && !last.isFinal) {
                        return [...prev.slice(0, -1), { ...last, text: currentInputTransRef.current }];
                    } else {
                        return [...prev, { id: Date.now().toString(), role: 'user', text: currentInputTransRef.current, isFinal: false }];
                    }
                });
              }

              if (message.serverContent?.turnComplete) {
                  // Mark messages as final and reset buffers
                  setMessages(prev => prev.map(m => ({ ...m, isFinal: true })));
                  currentInputTransRef.current = '';
                  currentOutputTransRef.current = '';
              }

              // --- Handle Audio Output ---
              const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
              if (audioData) {
                setStatus('speaking');
                
                try {
                  const audioBuffer = await decodeAudioData(audioData, ctx, 24000);
                  const source = ctx.createBufferSource();
                  source.buffer = audioBuffer;
                  source.connect(ctx.destination);
                  
                  const now = ctx.currentTime;
                  const startTime = Math.max(now, nextStartTimeRef.current);
                  source.start(startTime);
                  
                  nextStartTimeRef.current = startTime + audioBuffer.duration;
                  scheduledSourcesRef.current.push(source);
                  
                  source.onended = () => {
                    scheduledSourcesRef.current = scheduledSourcesRef.current.filter(s => s !== source);
                    if (scheduledSourcesRef.current.length === 0) {
                        setStatus('listening');
                    }
                  };
                } catch (err) {
                  console.error("Audio Decode Error", err);
                }
              }

              // --- Handle Tool Calls (Function Calling) ---
              if (message.toolCall) {
                const responses = [];
                for (const call of message.toolCall.functionCalls) {
                  if (call.name === 'getHistoricalPrices') {
                     const args = call.args as any;
                     const metal = args.metal;
                     const timeframe = args.timeframe || '1M';

                     // Show loading state
                     setIsToolLoading(true);
                     setToolLoadingMessage(`Fetching ${metal} price chart...`);

                     try {
                        const data = await fetchChartHistory(metal, timeframe);
                        setDisplayedChart({ metal, timeframe, data });
                        responses.push({
                            id: call.id,
                            name: call.name,
                            response: { result: `Displayed chart for ${metal} (${timeframe}).` }
                        });
                     } catch (e) {
                         responses.push({
                            id: call.id,
                            name: call.name,
                            response: { error: `Failed to fetch data.` }
                        });
                     } finally {
                         setIsToolLoading(false);
                         setToolLoadingMessage('');
                     }
                  } else if (call.name === 'getMarketNews') {
                      // Show loading state
                      setIsToolLoading(true);
                      setToolLoadingMessage('Fetching market news...');

                      try {
                          const news = await fetchMarketNews();
                          const headlines = news.slice(0, 3).map(n => `- ${n.title} (${n.source})`).join('\n');
                          responses.push({
                              id: call.id,
                              name: call.name,
                              response: { result: `Latest News:\n${headlines}` }
                          });
                      } catch (e) {
                          responses.push({
                              id: call.id,
                              name: call.name,
                              response: { error: "Failed to fetch news." }
                          });
                      } finally {
                          setIsToolLoading(false);
                          setToolLoadingMessage('');
                      }
                  }
                }

                if (responses.length > 0) {
                    sessionPromise.then(session => session.sendToolResponse({ functionResponses: responses }));
                }
              }
            },
            onclose: () => {
              console.log("Gemini Live Closed");
              onClose();
            },
            onerror: (err) => {
              console.error("Gemini Error:", err);
              setStatus('error');
              setErrorMessage("Connection lost. Please retry.");
            }
          }
        });
        
        sessionRef.current = sessionPromise;

      } catch (err: any) {
        console.error("Init Error:", err);
        setStatus('error');
        if (err.name === 'NotAllowedError' || err.message.includes('permission')) {
            setErrorMessage("Microphone access needed. Tap Start to allow.");
        } else {
            setErrorMessage("Connection failed. Please retry.");
        }
      }
  };

  // Send text message (for users who prefer typing or can't use mic)
  const sendTextMessage = async (text: string) => {
    if (!text.trim() || !sessionRef.current) return;

    // Add user message to UI immediately
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: text.trim(),
      isFinal: true
    };
    setMessages(prev => [...prev, userMessage]);
    setTextInput('');

    // Send to Gemini session
    try {
      const session = await sessionRef.current;
      session.sendClientContent({
        turns: [{ role: 'user', parts: [{ text: text.trim() }] }],
        turnComplete: true
      });
    } catch (err) {
      console.error('Failed to send text message:', err);
    }
  };

  // Handle text input submit
  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendTextMessage(textInput);
  };

  // Send initial prompt if provided (after session is ready)
  useEffect(() => {
    if (initialPrompt && status === 'listening' && messages.length === 0) {
      // Small delay to ensure session is fully ready
      const timer = setTimeout(() => {
        sendTextMessage(initialPrompt);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [initialPrompt, status]);

  // Attempt auto-start on mount, but handle failure gracefully
  useEffect(() => {
    startSession();

    return () => {
      if (inputStreamRef.current) inputStreamRef.current.getTracks().forEach(track => track.stop());
      if (processorRef.current) processorRef.current.disconnect();
      if (sourceRef.current) sourceRef.current.disconnect();
      if (audioContextRef.current) audioContextRef.current.close();
      if (sessionRef.current) sessionRef.current.then(session => session.close());
    };
  }, []); // Only on mount

  // Chart Rendering Helper
  const renderChart = () => {
      if (!displayedChart || displayedChart.data.length === 0) return null;
      
      const metalKey = Object.keys(METAL_COLORS).find(k => k.toLowerCase() === displayedChart.metal.toLowerCase());
      const chartColor = metalKey ? METAL_COLORS[metalKey as any] : '#D4AF37';

      return (
          <div className="w-full max-w-sm h-48 mt-8 bg-navy-800/50 rounded-xl border border-gold-500/20 p-2 animate-slide-up relative overflow-hidden backdrop-blur-md shadow-2xl shrink-0">
              <div className="absolute top-2 left-4 z-10">
                  <span className="text-xs font-bold text-gold-500 uppercase tracking-widest">{displayedChart.metal} • {displayedChart.timeframe}</span>
              </div>
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <AreaChart data={displayedChart.data}>
                    <defs>
                        <linearGradient id="liveChartGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={chartColor} stopOpacity={0.3}/>
                            <stop offset="95%" stopColor={chartColor} stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" strokeOpacity={0.1} />
                    <XAxis dataKey="date" hide />
                    <YAxis hide domain={['auto', 'auto']} />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#0A2240', borderColor: '#153b63', color: '#fff', fontSize: '10px' }}
                        itemStyle={{ color: '#F3F4F6' }}
                        formatter={(value: number) => [`$${value.toLocaleString()}`, 'Price']}
                    />
                    <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke={chartColor} 
                        strokeWidth={2}
                        fillOpacity={1} 
                        fill="url(#liveChartGrad)"
                        animationDuration={1000}
                    />
                </AreaChart>
            </ResponsiveContainer>
          </div>
      );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark-900/95 backdrop-blur-xl animate-fade-in">
      <div className="flex flex-col items-center justify-between w-full h-full p-4 md:p-8 text-center relative overflow-hidden">
        
        {/* Header */}
        <div className="absolute top-8 left-0 right-0 flex justify-center z-10">
            <span className="text-xs font-bold tracking-[0.2em] text-gold-500 uppercase">Maroon Live</span>
        </div>

        {/* --- Top Area: Orb and Status --- */}
        <div className={`flex flex-col items-center justify-center transition-all duration-500 w-full ${messages.length > 0 ? 'mt-16 flex-1 max-h-[40vh]' : 'flex-1'}`}>
            
            <div className="relative mb-6">
                {/* Outer Glow */}
                <div className={`absolute inset-0 rounded-full blur-3xl transition-all duration-1000 ${
                    status === 'speaking' ? 'bg-gold-500/40 scale-150' : 
                    status === 'listening' ? 'bg-blue-500/20 scale-110' : 
                    status === 'error' ? 'bg-red-500/20 scale-90' :
                    'bg-gray-500/10 scale-90'
                }`}></div>
                
                {/* Main Orb */}
                <button 
                    onClick={status === 'error' ? startSession : undefined}
                    disabled={status !== 'error'}
                    className={`w-24 h-24 md:w-32 md:h-32 rounded-full shadow-2xl flex items-center justify-center transition-all duration-500 relative z-20 ${
                    status === 'speaking' ? 'bg-gradient-to-br from-gold-400 to-gold-600 scale-110 animate-pulse' :
                    status === 'listening' ? 'bg-gradient-to-br from-dark-800 to-dark-700 border-2 border-gold-500/30' :
                    status === 'error' ? 'bg-navy-900 border-2 border-red-500 cursor-pointer hover:scale-105' :
                    'bg-dark-800 border border-gray-700'
                }`}>
                    {status === 'connecting' && (
                        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    )}
                    {status === 'listening' && (
                        <div className="flex space-x-1">
                            <div className="w-1 h-4 bg-gold-500 rounded-full animate-bounce delay-75"></div>
                            <div className="w-1 h-6 bg-gold-500 rounded-full animate-bounce delay-150"></div>
                            <div className="w-1 h-4 bg-gold-500 rounded-full animate-bounce delay-75"></div>
                        </div>
                    )}
                    {status === 'speaking' && (
                        <svg className="w-10 h-10 md:w-12 md:h-12 text-white/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 001.414 1.414m2.828-9.9a9 9 0 012.728-2.728" />
                        </svg>
                    )}
                    {status === 'error' && (
                        <div className="flex flex-col items-center">
                            <svg className="w-8 h-8 text-red-500 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                            <span className="text-[8px] uppercase font-bold text-red-400">Tap to Start</span>
                        </div>
                    )}
                </button>
            </div>

            {/* Status Text (Only show when no chat yet) */}
            {messages.length === 0 && (
                <div className="animate-fade-in">
                    <h2 className="text-2xl font-bold text-white mb-2 transition-opacity duration-300">
                        {status === 'connecting' && "Connecting..."}
                        {status === 'listening' && "Maroon is listening..."}
                        {status === 'speaking' && "Maroon is speaking"}
                        {status === 'error' && "Microphone Access"}
                    </h2>
                    
                    <p className="text-sm text-gray-400 max-w-xs mx-auto">
                        {status === 'error' ? errorMessage : "Ask about your portfolio or market trends."}
                    </p>
                </div>
            )}
        </div>

        {/* --- Chat Thread (Scrollable Overlay) --- */}
        {messages.length > 0 && (
            <div className="flex-1 w-full max-w-lg mx-auto overflow-y-auto px-4 mb-4 relative mask-image-gradient fade-in-up">
                <div className="space-y-4 py-4 min-h-0">
                    {messages.map((msg, index) => (
                        <div 
                            key={index} 
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}
                        >
                            <div className={`
                                max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed
                                ${msg.role === 'user' 
                                    ? 'bg-navy-800 text-white rounded-br-none border border-white/10' 
                                    : 'bg-gold-500/10 text-gold-100 rounded-bl-none border border-gold-500/20'
                                }
                            `}>
                                <p>{msg.text}{!msg.isFinal && <span className="inline-block w-1.5 h-3 ml-1 bg-current opacity-50 animate-pulse">|</span>}</p>
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
                
                {/* Scroll Fade Overlay */}
                <div className="sticky bottom-0 h-8 bg-gradient-to-t from-dark-900 to-transparent pointer-events-none"></div>
            </div>
        )}

        {/* Tool Loading Indicator */}
        {isToolLoading && (
          <div className="flex items-center gap-2 px-4 py-2 bg-gold-500/10 border border-gold-500/20 rounded-lg animate-pulse">
            <div className="w-4 h-4 border-2 border-gold-500/30 border-t-gold-500 rounded-full animate-spin"></div>
            <span className="text-sm text-gold-400">{toolLoadingMessage}</span>
          </div>
        )}

        {/* Dynamic Chart Display */}
        {renderChart()}

        {/* Error Banner (when in error state with messages) */}
        {status === 'error' && messages.length > 0 && (
          <div className="w-full max-w-lg mx-auto px-4 mb-4">
            <div className="flex items-center justify-between gap-3 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="text-sm text-red-300">{errorMessage || 'Connection lost'}</span>
              </div>
              <button
                onClick={startSession}
                className="px-3 py-1 text-xs font-medium text-white bg-red-500/30 hover:bg-red-500/50 rounded-full transition-colors"
              >
                Reconnect
              </button>
            </div>
          </div>
        )}

        {/* Text Input (for users without mic or who prefer typing) */}
        <div className="w-full max-w-lg mx-auto px-4 shrink-0">
          <form onSubmit={handleTextSubmit} className="flex items-center gap-2">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder={status === 'listening' ? "Type a message..." : "Waiting for connection..."}
              disabled={status !== 'listening' && status !== 'speaking'}
              className="flex-1 px-4 py-3 bg-dark-800/80 border border-white/10 rounded-full text-white text-sm placeholder-gray-500 focus:outline-none focus:border-gold-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              type="submit"
              disabled={!textInput.trim() || (status !== 'listening' && status !== 'speaking')}
              className="p-3 bg-gold-500/20 hover:bg-gold-500/30 disabled:bg-white/5 disabled:cursor-not-allowed rounded-full transition-colors"
            >
              <svg className="w-5 h-5 text-gold-400 disabled:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </form>
        </div>

        {/* Close Button */}
        <div className="shrink-0 mt-4 pb-6">
            <button
                onClick={onClose}
                className="px-8 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white text-sm font-medium tracking-wide transition-all border border-white/10 backdrop-blur-md"
            >
                End Session
            </button>
        </div>

      </div>
    </div>
  );
}
