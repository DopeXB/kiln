import express, { Router, Request, Response } from 'express';

const router = Router();
const projects: any = {};

router.get('/', (req: Request, res: Response) => {
  res.json({ projects: Object.values(projects) });
});

router.post('/', (req: Request, res: Response) => {
  const { name, description, template } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });

  const id = 'proj_' + Date.now();
  projects[id] = { id, name, description, template, createdAt: new Date() };
  res.status(201).json(projects[id]);
});

router.get('/:id', (req: Request, res: Response) => {
  const project = projects[req.params.id];
  if (!project) return res.status(404).json({ error: 'Not found' });
  res.json({ project });
});

router.put('/:id', (req: Request, res: Response) => {
  const project = projects[req.params.id];
  if (!project) return res.status(404).json({ error: 'Not found' });
  Object.assign(project, req.body);
  res.json({ success: true });
});

router.delete('/:id', (req: Request, res: Response) => {
  delete projects[req.params.id];
  res.json({ success: true });
});

module.exports = router;
