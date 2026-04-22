import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.send('Election Assistant Server is running!'));

const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

// We will try these models in order
const MODEL_NAMES = ["gemini-1.5-flash", "gemini-pro", "gemini-1.5-flash-latest"];

const systemInstruction = "You are an intelligent Indian Election Assistant. Help users understand the voting process in India clearly and neutrally.";

app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;

  // Try each model until one works
  for (const modelName of MODEL_NAMES) {
    try {
      console.log(`Attempting to use model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      
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
      
      // If we got here, it worked! Return the response.
      return res.json({ content: text });

    } catch (error: any) {
      console.error(`Model ${modelName} failed:`, error.message);
      // If it's a 404, we continue to the next model in the loop
      if (modelName === MODEL_NAMES[MODEL_NAMES.length - 1]) {
        return res.status(500).json({ error: "All Gemini models are currently unavailable. Please check your API key permissions." });
      }
    }
  }
});

app.listen(port, () => console.log(`Server running on port ${port}`));
