const BASE_URL = 'https://api.themoviedb.org/3';

exports.handler = async (event) => {
  try {
    const apiKey = process.env.TMDB_API_KEY;

    if (!apiKey) {
      return {
        statusCode: 500,
        headers: {
          'content-type': 'application/json',
          'cache-control': 'no-store',
        },
        body: JSON.stringify({ error: 'Missing TMDB_API_KEY on server' }),
      };
    }

    const endpoint = event.queryStringParameters?.endpoint;
    if (!endpoint || !endpoint.startsWith('/')) {
      return {
        statusCode: 400,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid endpoint' }),
      };
    }

    const params = new URLSearchParams(event.queryStringParameters || {});
    params.delete('endpoint');
    params.set('api_key', apiKey);

    const response = await fetch(`${BASE_URL}${endpoint}?${params.toString()}`);
    const text = await response.text();

    return {
      statusCode: response.status,
      headers: {
        'content-type': 'application/json',
        'cache-control': 'public, max-age=60, s-maxage=300',
      },
      body: text,
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ error: 'TMDB proxy failure' }),
    };
  }
};
