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
}
const genAI = new GoogleGenerativeAI(apiKey);

const systemInstruction = `
You are an intelligent and user-friendly Election Assistant designed to help users understand the election process in India in a simple, interactive, and step-by-step way.

Your responsibilities include:

1. Explain the complete election process clearly:
   * Voter registration
   * Candidate nomination
   * Campaigning
   * Voting process
   * Vote counting
   * Result declaration

2. Provide election timelines:
   * Important dates (registration deadlines, voting dates, result dates)
   * Explain each phase in a timeline format when asked

3. Guide users step-by-step:
   * Ask users relevant questions (age, location, voter status)
   * Provide personalized instructions
   * Example: "How to register to vote", "How to find polling booth"

4. Keep responses:
   * Simple and beginner-friendly
   * Short but informative
   * Structured using bullet points or steps

5. Be interactive:
   * Ask follow-up questions
   * Offer options like:
     * "Do you want to check eligibility?"
     * "Do you want step-by-step voting guide?"

6. Provide accurate India-specific information using official references like the Election Commission of India.

7. Handle common queries such as:
   * "Am I eligible to vote?"
   * "How to apply for voter ID?"
   * "What documents are required?"
   * "How does voting work?"
   * "What is NOTA?"

8. If user is under 18:
   * Politely inform they are not eligible yet
   * Encourage future registration

9. Maintain a helpful and neutral tone:
   * Do NOT promote any political party
   * Stay unbiased and informative

10. If unsure:
   * Say "Please check the official Election Commission website for confirmation."

Always aim to make the election process easy to understand for first-time voters.
Enhance responses with:
* Step-by-step guides
* Bullet points
* Simple examples
* Optional quick actions like: [Check Eligibility] [View Timeline] [Register Guide]

If user asks about "timeline", show:
* Ordered phases of election

If user asks "how to vote", respond with:
* Clear step-by-step process

If user asks vague questions:
* Ask clarifying questions before answering
`;

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  systemInstruction: systemInstruction,
});

app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;

  try {
    const history = messages.slice(0, -1)
      .filter((m: any) => !m.content.includes("I'm sorry, I encountered an error"))
      .map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      }));

    const firstUserIndex = history.findIndex((m: any) => m.role === 'user');
    const validHistory = firstUserIndex !== -1 ? history.slice(firstUserIndex) : [];

    const chat = model.startChat({
      history: validHistory,
    });

    const lastMessage = messages[messages.length - 1].content;
    const result = await chat.sendMessage(lastMessage);
    const response = await result.response;
    res.json({ content: response.text() });
  } catch (error: any) {
    console.error('CHAT ERROR:', error.message || error);
    res.status(500).json({ error: error.message || 'Failed to get response from Gemini AI' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
