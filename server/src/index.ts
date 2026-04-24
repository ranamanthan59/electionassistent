import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Serve static files from the React app
const clientDistPath = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDistPath));

app.get('/health', (req, res) => res.send('OK'));

const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

const MODEL_NAMES = [
  "gemini-2.0-flash-lite", 
  "gemini-flash-lite-latest",
  "gemini-2.0-flash", 
  "gemini-flash-latest", 
  "gemini-pro-latest",
  "gemini-2.5-flash-lite"
];

const systemInstruction = "You are an intelligent Indian Election Assistant. Help users understand the voting process in India clearly and neutrally.";

app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;
  console.log(`[${new Date().toISOString()}] Received chat request with ${messages.length} messages`);

  console.log(`Received request with ${messages.length} messages`);

  for (const modelName of MODEL_NAMES) {
    try {
      console.log(`Attempting to use model: ${modelName} (v1beta)`);
      const model = genAI.getGenerativeModel({ model: modelName }, { apiVersion: 'v1beta' });
      
      const history = messages.slice(0, -1)
        .map((m: any) => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: String(m.content) }],
        }))
        .filter((m: any, i: number, arr: any[]) => {
          if (i === 0 && m.role !== 'user') return false;
          if (i > 0 && m.role === arr[i-1].role) return false;
          return true;
        });

      const chat = model.startChat({ history });
      let lastMessage = String(messages[messages.length - 1].content);

      if (history.length === 0) {
        lastMessage = `${systemInstruction}\n\nUser Question: ${lastMessage}`;
      }

      const result = await chat.sendMessage(lastMessage);
      const text = result.response.text();
      
      console.log(`Success with ${modelName}!`);
      return res.json({ content: text });

    } catch (error: any) {
      console.error(`Model ${modelName} failed:`, error.message);
      if (modelName === MODEL_NAMES[MODEL_NAMES.length - 1]) {
        return res.status(500).json({ error: `All Gemini models failed. Last error: ${error.message}` });
      }
    }
  }
});

// FIX: Express 5.x catch-all syntax
app.get('*path', (req, res) => {
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Serving client from: ${clientDistPath}`);
});
