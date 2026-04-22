import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Election Assistant Server is running!');
});

const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

// Using the 'latest' alias which is usually the most resilient
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash-latest",
});

const systemInstruction = `
You are an intelligent and user-friendly Election Assistant designed to help users understand the election process in India.
Stay unbiased, neutral, and helpful. Use bullet points.
`;

app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;

  try {
    if (!messages || messages.length === 0) {
      return res.status(400).json({ error: 'No messages provided' });
    }

    // Standardize history
    const history = messages.slice(0, -1)
      .map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: String(m.content) }],
      }))
      .filter((m: any, i: number, arr: any[]) => {
        // Ensure no consecutive roles and starts with user
        if (i === 0 && m.role !== 'user') return false;
        if (i > 0 && m.role === arr[i-1].role) return false;
        return true;
      });

    const chat = model.startChat({
      history: history,
    });

    let lastMessage = String(messages[messages.length - 1].content);

    // If it's a new chat, add instructions
    if (history.length === 0) {
      lastMessage = `${systemInstruction}\n\nUser Question: ${lastMessage}`;
    }

    const result = await chat.sendMessage(lastMessage);
    const text = result.response.text();
    
    res.json({ content: text });
  } catch (error: any) {
    console.error('BACKEND ERROR:', error.message || error);
    res.status(500).json({ error: 'Gemini is having a moment. Please try one more time.' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
