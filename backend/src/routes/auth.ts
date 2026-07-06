import express, { Router, Request, Response } from 'express';

const router = Router();

router.post('/register', (req: Request, res: Response) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name)
    return res.status(400).json({ error: 'All fields required' });

  const user = {
    id: 'user_' + Date.now(),
    email,
    name,
    createdAt: new Date(),
  };
  res.status(201).json(user);
});

router.post('/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'Email and password required' });

  res.json({
    token: 'jwt_token_' + Date.now(),
    user: { id: 'user_1', email },
  });
});

router.get('/profile', (req: Request, res: Response) => {
  res.json({
    id: 'user_1',
    email: 'user@example.com',
    name: 'User',
  });
});

module.exports = router;
