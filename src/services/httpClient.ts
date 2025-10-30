/**
 * Simple HTTP client wrapper for forwarding requests
 */

interface HttpClientOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
}

export async function makeRequest(
  url: string,
  options: HttpClientOptions = {}
): Promise<any> {
  const { method = 'POST', headers = {}, body } = options;

  try {
    console.log(`[HTTP Client] ${method} ${url}`);

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();

    console.log(`[HTTP Client] Response status: ${response.status}`);

    return {
      status: response.status,
      data,
    };
  } catch (error) {
    console.error(`[HTTP Client] Error:`, error);
    throw error;
  }
}
