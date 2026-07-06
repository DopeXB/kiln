import express, { Router, Request, Response } from 'express';

const router = Router();

// Execute code in sandbox
router.post('/run', async (req: Request, res: Response) => {
  const { code, language, context } = req.body;

  if (!code || !language) {
    return res.status(400).json({ error: 'Code and language are required' });
  }

  try {
    // TODO: Send to sandbox executor
    res.json({
      success: true,
      output: 'Code execution result',
      executionTime: 0,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get execution history
router.get('/history', async (req: Request, res: Response) => {
  // TODO: Fetch from database
  res.json({ executions: [] });
});

module.exports = router;
