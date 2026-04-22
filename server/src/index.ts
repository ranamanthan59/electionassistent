import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const apiKey = process.env.GEMINI_API_KEY || '';
if (!apiKey) {
  console.error('ERROR: GEMINI_API_KEY is not defined in the environment!');
} else {
  console.log(`API Key detected. Length: ${apiKey.length}. Starts with: ${apiKey.substring(0, 4)}...`);
}
const genAI = new GoogleGenerativeAI(apiKey);

// Using the most stable model without the problematic systemInstruction field
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
});

const systemInstruction = `
You are an intelligent and user-friendly Election Assistant designed to help users understand the election process in India in a simple, interactive, and step-by-step way.
Stay unbiased, neutral, and helpful. Use bullet points and step-by-step guides.
If you are unsure, refer to the Election Commission of India.
`;

app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;

  try {
    // 1. Standardize history
    const rawHistory = messages.slice(0, -1)
      .map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      }));

    // 2. Ensure history starts with user
    const firstUserIndex = rawHistory.findIndex((m: any) => m.role === 'user');
    let history = firstUserIndex !== -1 ? rawHistory.slice(firstUserIndex) : [];

    const chat = model.startChat({
      history: history,
    });

    // 3. Get the last message
    let lastMessage = messages[messages.length - 1].content;

    // 4. If this is the start of the chat, prepend the instructions to the message
    if (history.length === 0) {
      lastMessage = `INSTRUCTIONS: ${systemInstruction}\n\nUSER MESSAGE: ${lastMessage}`;
    }

    const result = await chat.sendMessage(lastMessage);
    const response = await result.response;
    const text = response.text();
    
    if (!text) {
      throw new Error('Empty response from Gemini');
    }

    res.json({ content: text });
  } catch (error: any) {
    console.error('FULL CHAT ERROR:', error);
    res.status(500).json({ error: error.message || 'Failed to get response from Gemini AI' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
