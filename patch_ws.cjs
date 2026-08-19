const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const wsCode = `
  const wss = new WebSocketServer({ noServer: true });

  (server as any).on('upgrade', async (request, socket, head) => {
    const { pathname, query } = parse(request.url || '', true);
    if (pathname === '/api/live') {
      try {
        const token = query.token as string;
        const sessionIdStr = query.sessionId as string;
        
        if (!token || !sessionIdStr) {
          socket.write('HTTP/1.1 401 Unauthorized\\r\\n\\r\\n');
          socket.destroy();
          return;
        }
        
        // Simple token verification
        const [candidate] = await db.select().from(candidates).where(eq(candidates.uid, token));
        if (!candidate) {
          socket.write('HTTP/1.1 401 Unauthorized\\r\\n\\r\\n');
          socket.destroy();
          return;
        }

        const sessionId = parseInt(sessionIdStr);
        const [sessionRow] = await db.select().from(sessions).where(eq(sessions.id, sessionId));
        
        if (!sessionRow || sessionRow.candidateId !== candidate.id) {
          socket.write('HTTP/1.1 403 Forbidden\\r\\n\\r\\n');
          socket.destroy();
          return;
        }
        
        // Fetch resume analysis for context
        const [resumeAnalysis] = await db.select().from(resumeAnalyses).where(eq(resumeAnalyses.sessionId, sessionId));

        (request as any).context = { candidate, session: sessionRow, resumeAnalysis };

        wss.handleUpgrade(request, socket as any, head, (ws) => {
          wss.emit('connection', ws, request);
        });
      } catch (err) {
        socket.write('HTTP/1.1 500 Internal Server Error\\r\\n\\r\\n');
        socket.destroy();
      }
    }
  });

  wss.on("connection", async (clientWs, request) => {
    try {
      const { candidate, session, resumeAnalysis } = (request as any).context;
      
      const candidateContext = resumeAnalysis 
        ? \`Candidate Name: \${candidate.name}. Skills: \${resumeAnalysis.skills?.join(', ')}. Strengths: \${resumeAnalysis.strengths?.join(', ')}. Job Role specific gaps to watch for: \${resumeAnalysis.missingKeywords?.join(', ')}.\` 
        : \`Candidate Name: \${candidate.name}\`;

      const ai = new GoogleGenAI({ 
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
      const liveSession = await ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Aoede" } },
          },
          systemInstruction: \`You are the 'Friendly HR' AI interviewer for Ravengard AI Recruiter. 
          Your goal is to greet the candidate, break the ice, introduce yourself, and test their communication style. 
          
          Candidate Context: \${candidateContext}
          
          Rules:
          - Ask one question at a time. 
          - Be warm, low-pressure, and conversational. 
          - Do NOT reveal live scores, pass/fail status. 
          - Limit this round to 4-6 turns. 
          - If the candidate stops speaking, gently prompt them to continue or move to the next question.
          - Never fabricate claims about the candidate.\`,
        },
        callbacks: {
          onmessage: (message: LiveServerMessage) => {
            const audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audio && clientWs.readyState === 1) {
              clientWs.send(JSON.stringify({ audio }));
            }
            if (message.serverContent?.interrupted && clientWs.readyState === 1) {
              clientWs.send(JSON.stringify({ interrupted: true }));
            }
          },
        },
      });

      clientWs.on("message", (data) => {
        try {
          const parsed = JSON.parse(data.toString());
          if (parsed.audio) {
            liveSession.sendRealtimeInput({
              audio: { data: parsed.audio, mimeType: "audio/pcm;rate=16000" },
            });
          }
        } catch(e) { console.error("WS msg parse error", e); }
      });

      clientWs.on("close", () => {
        try { liveSession.close(); } catch(e) {}
      });
    } catch(e) {
      console.error("Live API connection error:", e);
      if (clientWs.readyState === 1) clientWs.close();
    }
  });
}

startServer();
`;

const splitIdx = code.indexOf('const wss = new WebSocketServer({ noServer: true });');
if (splitIdx > -1) {
  code = code.substring(0, splitIdx) + wsCode;
  fs.writeFileSync('server.ts', code);
} else {
  console.error("Could not find the insertion point.");
}
