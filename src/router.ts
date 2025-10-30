/**
 * Action Router
 * Maps action names to their corresponding service endpoints
 */

import { hrServiceConfig } from './services/hr';
import { makeRequest } from './services/httpClient';

interface ActionPayload {
  action: string;
  args: Record<string, any>;
  mode: 'simulate' | 'execute';
}

interface ServiceConfig {
  url: string;
  method: string;
}

// Registry of all services
const actionRegistry: Record<string, ServiceConfig> = {
  ...hrServiceConfig,
  // Add more service configs here as needed
  // ...financeServiceConfig,
  // ...inventoryServiceConfig,
};

/**
 * Route an action to its corresponding service
 */
export async function routeAction(payload: ActionPayload) {
  const { action, args, mode } = payload;

  console.log(`[Router] Received action: ${action} (mode: ${mode})`);
  console.log(`[Router] Arguments:`, args);

  // Look up the service configuration
  const serviceConfig = actionRegistry[action];

  if (!serviceConfig) {
    throw new Error(`Unknown action: ${action}`);
  }

  console.log(`[Router] Routing to: ${serviceConfig.url}`);

  // Forward the request to the service
  const result = await makeRequest(serviceConfig.url, {
    method: serviceConfig.method,
    body: {
      ...args,
      mode, // Pass mode to the service
    },
  });

  return result;
}

/**
 * Get all registered actions
 */
export function getRegisteredActions(): string[] {
  return Object.keys(actionRegistry);
}
