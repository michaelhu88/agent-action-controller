/**
 * Action Controller - Minimal API Gateway
 * Entry point for the application
 */

import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import { routeAction, getRegisteredActions } from './router';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Request logging middleware
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

/**
 * Main action execution endpoint
 */
app.post('/actions/execute', async (req: Request, res: Response) => {
  try {
    const { action, args, mode } = req.body;

    // Basic validation
    if (!action) {
      return res.status(400).json({
        error: 'Missing required field: action',
      });
    }

    if (!args) {
      return res.status(400).json({
        error: 'Missing required field: args',
      });
    }

    if (!mode || !['simulate', 'execute'].includes(mode)) {
      return res.status(400).json({
        error: 'Invalid or missing mode. Must be "simulate" or "execute"',
      });
    }

    // Route the action
    const result = await routeAction({ action, args, mode });

    // Return the service's response
    res.status(result.status).json(result.data);
  } catch (error: any) {
    console.error('[Action Controller] Error:', error);

    if (error.message?.startsWith('Unknown action:')) {
      return res.status(404).json({
        error: error.message,
        availableActions: getRegisteredActions(),
      });
    }

    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

/**
 * Health check endpoint
 */
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    registeredActions: getRegisteredActions(),
  });
});

/**
 * Root endpoint
 */
app.get('/', (_req: Request, res: Response) => {
  res.json({
    service: 'Action Controller',
    version: '1.0.0',
    endpoints: {
      execute: 'POST /actions/execute',
      health: 'GET /health',
    },
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`[Action Controller] Server running on port ${PORT}`);
  console.log(`[Action Controller] Registered actions:`, getRegisteredActions());
});
