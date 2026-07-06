import express, { Router, Request, Response } from 'express';

const router = Router();

router.post('/run', async (req: Request, res: Response) => {
  const { code, language, context } = req.body;
  if (!code || !language)
    return res.status(400).json({ error: 'Code and language required' });

  try {
    // Simulate code execution
    res.json({
      success: true,
      output: 'Code executed successfully',
      executionTime: 125,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/history', (req: Request, res: Response) => {
  res.json({ executions: [] });
});

module.exports = router;
