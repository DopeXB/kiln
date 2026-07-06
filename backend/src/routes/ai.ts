import express, { Router, Request, Response } from 'express';
import { AIEngine } from '../services/ai-engine';

const router = Router();
const aiEngine = new AIEngine();

router.post('/chat', async (req: Request, res: Response) => {
  const { message, context, projectId } = req.body;
  if (!message) return res.status(400).json({ error: 'Message required' });
  try {
    const response = await aiEngine.chat(message, { context, projectId });
    res.json(response);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/generate-code', async (req: Request, res: Response) => {
  const { description, language, context } = req.body;
  if (!description || !language)
    return res.status(400).json({ error: 'Description and language required' });
  try {
    const code = await aiEngine.generateCode(description, language);
    res.json({ code });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/suggest', async (req: Request, res: Response) => {
  const { fileContent, filePath, language } = req.body;
  try {
    const suggestions = await aiEngine.getSuggestions(
      fileContent,
      filePath,
      language
    );
    res.json({ suggestions });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
