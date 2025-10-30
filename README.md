# Action Controller

A minimal API gateway that receives action payloads and forwards them to the appropriate service endpoint.

## Features

- Single `/actions/execute` endpoint for all actions
- Action-to-service routing
- Request logging
- Simple and lightweight

## Installation

```bash
npm install
```

## Configuration

Edit `.env` to configure service URLs:

```env
PORT=3000
HR_SERVICE_URL=http://localhost:3001
```

## Running

Development mode (with auto-reload):
```bash
npm run dev
```

Production build:
```bash
npm run build
npm start
```

**PM2 (for production on Linux):**
```bash
npm run build
npm run pm2:start
```

For detailed Linux deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)

## API Usage

### Execute an Action

**Endpoint:** `POST /actions/execute`

**Request Body:**
```json
{
  "action": "CreateEmployee",
  "args": {
    "name": "John Doe",
    "email": "john@example.com"
  },
  "mode": "execute"
}
```

**Response:**
Returns whatever the downstream service returns.

### Health Check

**Endpoint:** `GET /health`

Returns service status and list of registered actions.

## Example Flow

1. Client sends action request to `/actions/execute`
2. Router detects action name (e.g., "CreateEmployee")
3. Request is forwarded to corresponding service (e.g., HR service)
4. Service response is returned to client

## Available Actions

### HR Actions
- `CreateEmployee` - Create a new employee
- `UpdateEmployee` - Update employee information
- `DeleteEmployee` - Delete an employee
- `GetEmployee` - Get employee details

## Adding New Services

1. Create a new service config file in `src/services/` (e.g., `finance.ts`)
2. Define action-to-endpoint mappings
3. Import and add to `actionRegistry` in `src/router.ts`
4. Add service URL to `.env`

## Project Structure

```
/action-controller
 ├── src/
 │    ├── index.ts             # Entry point & Express server
 │    ├── router.ts            # Action routing logic
 │    ├── services/
 │    │    ├── httpClient.ts   # HTTP request wrapper
 │    │    └── hr.ts           # HR service configuration
 ├── package.json
 ├── .env
 └── README.md
```

## License

MIT
