/**
 * A wrapper method around `fetch` that attaches an AbortController signal to the `fetch` call for clean timeouts
 * @see https://www.npmjs.com/package/node-fetch#request-cancellation-with-abortsignal
 * @param {string} url          The URL to make the Request to
 * @param {Object} data         The data of the Request
 * @param {int} timeoutMs       How long to wait for a Response before cleanly aborting
 * @param {function} onTimeout  A method to invoke if and when the timeout is reached
 * @return {Promise<Response>}
 * @throws {HttpError}
 */
export async function fetchWithTimeout(url, data = {}, {timeoutMs=30000, onTimeout = () => {}} = {}) {
  const controller = new AbortController();
  data.signal = controller.signal;
  let timedOut = false;

  // Begin the timer
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
    onTimeout();
  }, timeoutMs);

  // Attempt the request
  let response;
  try {
    response = await fetch(url, data);
  } catch(err) {
    if ( timedOut ) throw new HttpError("Timed Out", 408, `The request to ${url} timed out after ${timeoutMs} ms`);
    throw err;
  } finally {
    clearTimeout(timeout);
  }

  // Return the response
  if ( !response.ok && (response.type !== "opaqueredirect") ) {
    const responseBody = response.body ? await response.text() : "";
    throw new HttpError(response.statusText, response.status, responseBody);
  }
  return response;
}

/* ----------------------------------------- */

/**
 * A small wrapper that automatically asks for JSON
 * @param {string} url          The URL to make the Request to
 * @param {Object} data         The data of the Request
 * @param {int} timeoutMs       How long to wait for a Response before cleanly aborting
 * @param {function} onTimeout  A method to invoke if and when the timeout is reached
 * @returns {Promise<*>}
 */
export async function fetchJsonWithTimeout(url, data = {}, {timeoutMs=30000, onTimeout = () => {}} = {}) {
  let response = await fetchWithTimeout(url, data, {timeoutMs: timeoutMs, onTimeout: onTimeout});
  return response.json();
}

/* ----------------------------------------- */

/**
 * Represents an HTTP Error when a non-OK response is returned by Fetch
 * @extends {Error}
 */
export class HttpError extends Error {
  constructor(statusText, code, displayMessage="") {
    super(statusText);
    this.code = code;
    this.displayMessage = displayMessage;
  }
}
