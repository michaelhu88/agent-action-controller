# Action Controller Architecture

## Overview

The Action Controller is a minimal API gateway that acts as a central routing hub for action-based requests. It receives standardized action payloads and intelligently forwards them to the appropriate backend services based on the action name.

## Core Concept

Instead of clients needing to know the specific endpoints for each service (HR, Finance, Inventory, etc.), they send all requests to a single endpoint with a standardized payload format. The Action Controller handles the routing logic.

### Traditional Approach (Without Action Controller)
```
Client → http://hr-service/employees/create
Client → http://finance-service/invoices/create
Client → http://inventory-service/products/update
```

### With Action Controller
```
Client → http://action-controller/actions/execute
         ↓
    Action Controller (routes based on action name)
         ↓
    HR Service / Finance Service / Inventory Service
```

## How It Works

### 1. Request Format

All requests follow a consistent structure:

```json
{
  "action": "CreateEmployee",
  "args": {
    "name": "John Doe",
    "email": "john@example.com",
    "department": "Engineering"
  },
  "mode": "execute"
}
```

**Fields:**
- `action`: The name of the action to perform (e.g., "CreateEmployee", "UpdateInvoice")
- `args`: Arguments/parameters for the action (varies per action)
- `mode`: Either "simulate" (dry-run) or "execute" (actual execution)

### 2. Request Flow

```
1. Client sends POST request to /actions/execute
   ↓
2. Express server receives and validates the request
   ↓
3. Router looks up the action in the actionRegistry
   ↓
4. Router finds the corresponding service URL and HTTP method
   ↓
5. HTTP client forwards the request to the service
   ↓
6. Service processes the request and returns a response
   ↓
7. Action Controller returns the service's response to the client
```

### 3. Action Registry

The heart of the system is the action registry in `src/router.ts`:

```typescript
const actionRegistry: Record<string, ServiceConfig> = {
  CreateEmployee: {
    url: 'http://hr-service/employees/create',
    method: 'POST'
  },
  UpdateEmployee: {
    url: 'http://hr-service/employees/update',
    method: 'POST'
  },
  // ... more actions
}
```

This maps action names to their corresponding service endpoints.

### 4. Service Configuration

Each service has its own configuration file (e.g., `src/services/hr.ts`):

```typescript
export const hrServiceConfig = {
  CreateEmployee: {
    url: `${HR_SERVICE_BASE_URL}/employees/create`,
    method: 'POST',
  },
  UpdateEmployee: {
    url: `${HR_SERVICE_BASE_URL}/employees/update`,
    method: 'POST',
  },
  // ... more HR actions
};
```

This makes it easy to:
- Add new actions for a service
- Update service URLs
- Organize actions by service domain

## Architecture Components

### `/src/index.ts` - Express Server
- Initializes the Express application
- Defines the `/actions/execute` endpoint
- Handles request validation
- Manages error responses
- Provides health check endpoint

### `/src/router.ts` - Action Router
- Maintains the action registry
- Maps action names to service configurations
- Forwards requests to the appropriate service
- Returns service responses to the client

### `/src/services/httpClient.ts` - HTTP Client
- Wrapper around the native `fetch` API
- Handles HTTP requests to backend services
- Adds standard headers (Content-Type, etc.)
- Logs all outgoing requests
- Manages error handling

### `/src/services/*.ts` - Service Configurations
- Define action-to-endpoint mappings per service
- Store service base URLs (from environment variables)
- Export typed action names for each service

## Key Benefits

### 1. Centralized Routing
All routing logic is in one place, making it easy to see which actions go where.

### 2. Decoupled Clients
Clients don't need to know about service URLs or endpoints - just action names.

### 3. Easy to Extend
Adding a new action is as simple as:
1. Add entry to service config
2. That's it - no client changes needed

### 4. Consistent Interface
All requests follow the same format, regardless of the underlying service.

### 5. Request Logging
Every request is logged, providing visibility into action usage.

### 6. Mode Support
The "simulate" vs "execute" mode allows for dry-runs before actual execution.

## Example Scenarios

### Scenario 1: Creating an Employee

**Client Request:**
```json
POST /actions/execute
{
  "action": "CreateEmployee",
  "args": {
    "name": "Alice Smith",
    "email": "alice@company.com"
  },
  "mode": "execute"
}
```

**What Happens:**
1. Action Controller receives the request
2. Looks up "CreateEmployee" in the registry
3. Finds: `POST http://hr-service/employees/create`
4. Forwards request to HR service with args and mode
5. HR service creates the employee
6. HR service returns: `{ "id": "emp_123", "status": "created" }`
7. Action Controller returns this response to the client

### Scenario 2: Unknown Action

**Client Request:**
```json
POST /actions/execute
{
  "action": "DeleteUniverse",
  "args": {},
  "mode": "execute"
}
```

**Response:**
```json
{
  "error": "Unknown action: DeleteUniverse",
  "availableActions": [
    "CreateEmployee",
    "UpdateEmployee",
    "DeleteEmployee",
    "GetEmployee"
  ]
}
```

### Scenario 3: Simulate Mode

**Client Request:**
```json
POST /actions/execute
{
  "action": "DeleteEmployee",
  "args": { "id": "emp_123" },
  "mode": "simulate"
}
```

**What Happens:**
The mode is passed to the service, which can:
- Validate the operation would succeed
- Check permissions
- Return what would happen without actually doing it

## Adding a New Service

Let's say you want to add a Finance service:

### Step 1: Create Service Config

Create `src/services/finance.ts`:

```typescript
const FINANCE_SERVICE_BASE_URL = process.env.FINANCE_SERVICE_URL || 'http://localhost:3002';

export const financeServiceConfig = {
  CreateInvoice: {
    url: `${FINANCE_SERVICE_BASE_URL}/invoices/create`,
    method: 'POST',
  },
  ProcessPayment: {
    url: `${FINANCE_SERVICE_BASE_URL}/payments/process`,
    method: 'POST',
  },
};
```

### Step 2: Register Actions

Update `src/router.ts`:

```typescript
import { financeServiceConfig } from './services/finance';

const actionRegistry: Record<string, ServiceConfig> = {
  ...hrServiceConfig,
  ...financeServiceConfig, // Add this line
};
```

### Step 3: Configure Environment

Add to `.env`:

```env
FINANCE_SERVICE_URL=http://localhost:3002
```

### Step 4: Done!

Now clients can use:

```json
{
  "action": "CreateInvoice",
  "args": { "amount": 1000, "customer": "ACME Corp" },
  "mode": "execute"
}
```

## Error Handling

The Action Controller handles errors at multiple levels:

1. **Validation Errors** (400): Missing required fields
2. **Unknown Actions** (404): Action not in registry
3. **Service Errors** (varies): Passed through from the service
4. **Internal Errors** (500): Unexpected failures

All errors are logged to the console for debugging.

## Logging

Every request generates logs:

```
[2025-01-15T10:30:00.000Z] POST /actions/execute
[Router] Received action: CreateEmployee (mode: execute)
[Router] Arguments: { name: 'John Doe', email: 'john@example.com' }
[Router] Routing to: http://localhost:3001/employees/create
[HTTP Client] POST http://localhost:3001/employees/create
[HTTP Client] Response status: 200
```

This provides full visibility into the request flow.

## Security Considerations

This minimal version does NOT include:
- Authentication/Authorization
- Rate limiting
- Input validation/sanitization
- Request signing
- CORS configuration

These should be added for production use.

## Future Enhancements

Possible additions to make this production-ready:

1. **Schema Validation**: Validate args against schemas
2. **Authentication**: JWT/API key validation
3. **Rate Limiting**: Prevent abuse
4. **Caching**: Cache responses for certain actions
5. **Retry Logic**: Automatic retries on failure
6. **Circuit Breaker**: Prevent cascading failures
7. **Request Tracing**: Distributed tracing with correlation IDs
8. **Metrics**: Track action usage, latency, errors
9. **Health Checks**: Monitor backend service health
10. **Request Queueing**: Handle high load with queues

## Summary

The Action Controller is a lightweight pattern for:
- Centralizing service routing logic
- Providing a consistent client interface
- Decoupling clients from service implementations
- Logging and monitoring action usage
- Supporting simulation/dry-run modes

It's designed to be simple to understand, easy to extend, and straightforward to deploy.
