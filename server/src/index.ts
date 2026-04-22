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

// Using the absolute most compatible model name and stable API version
const model = genAI.getGenerativeModel({
  model: "gemini-pro",
}, { apiVersion: 'v1' });

const systemInstruction = `
You are an intelligent and user-friendly Election Assistant designed to help users understand the election process in India.
Stay unbiased, neutral, and helpful. Use bullet points.
If you are unsure, refer to the Election Commission of India.
`;

app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;

  try {
    const rawHistory = messages.slice(0, -1)
      .map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      }));

    const firstUserIndex = rawHistory.findIndex((m: any) => m.role === 'user');
    let history = firstUserIndex !== -1 ? rawHistory.slice(firstUserIndex) : [];

    const chat = model.startChat({
      history: history,
    });

    let lastMessage = messages[messages.length - 1].content;

    // Prepend instructions if starting a new conversation
    if (history.length === 0) {
      lastMessage = `${systemInstruction}\n\nUser Question: ${lastMessage}`;
    }

    const result = await chat.sendMessage(lastMessage);
    const response = await result.response;
    const text = response.text();
    
    res.json({ content: text });
  } catch (error: any) {
    console.error('FINAL ATTEMPT ERROR:', error.message || error);
    res.status(500).json({ error: error.message || 'Failed to get response from Gemini AI' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
