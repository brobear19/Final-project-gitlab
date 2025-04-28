const express = require('express');
const router = express.Router();
const axios = require('axios');

// Replace with your actual Gemini API KEY
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Gemini endpoint
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

// Helper to call Gemini
async function askGemini(prompt) {
  const response = await axios.post(
    `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
    {
      contents: [{
        parts: [{ text: prompt }]
      }]
    }
  );

  const content = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
  return content || "Unknown";
}

// API endpoint
router.get('/recommend', async (req, res) => {
  try {
    const { playerChips, pot, currentBid, hand, communityCards } = req.query;

    if (!playerChips || !pot || !currentBid || !hand || !communityCards) {
      return res.status(400).json({ error: 'Missing parameters' });
    }

    // Format prompt
    const prompt = `
You are helping a poker player decide their next move. 
Here is the current game state:
- Player's Chips: ${playerChips}
- Pot Size: ${pot}
- Current Highest Bet to Call: ${currentBid}
- Player's Hand: ${hand}
- Community Cards: ${communityCards}

Recommend whether the player should "bet", "fold", or "check", and briefly explain why in one sentence.
Answer with just the move: "bet", "fold", or "check".
`;

    const recommendation = await askGemini(prompt);

    res.json({ move: recommendation.trim().toLowerCase() });
  } catch (error) {
    console.error('Error recommending move:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to get recommendation' });
  }
});

module.exports = router;
