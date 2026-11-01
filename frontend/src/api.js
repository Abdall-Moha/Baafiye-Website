// Address of the backend API.
// Change it in the frontend .env file:  VITE_API_URL=http://localhost:5000/api
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Address of the backend server (the same address without "/api")
// The uploaded pictures are served from here: http://localhost:5000/uploads/...
const SERVER_URL = API_URL.replace(/\/api\/?$/, "");

// Turns "/uploads/abc.jpg" into "http://localhost:5000/uploads/abc.jpg"
// A full address (https://...) is left as it is. Empty gives "".
export function imageUrl(path) {
  if (!path) return "";

  if (path.startsWith("http")) return path;

  return `${SERVER_URL}${path}`;
}

// ONE function for every backend call.
// It never crashes. It always gives back { ok, status, data }
//   ok     = true when the request worked
//   status = 200, 400, 401, 429...
//   data   = the JSON from the backend (data.message is the text to show)
// Use { auth: true } for routes that need login (it sends the token).
// "body" can be a normal object (sent as JSON) or FormData (for pictures).
export async function api(path, { method = "GET", body, auth = false } = {}) {
  // Headers sent with the request
  const headers = {};

  // Is the body FormData? (used when we upload a picture)
  const isFormData = body instanceof FormData;

  // JSON needs this header. FormData must NOT have it:
  // the browser adds its own header for FormData.
  if (body && !isFormData) {
    headers["Content-Type"] = "application/json";
  }

  // Add the login token for protected routes
  const token = localStorage.getItem("token");

  if (auth && token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    // Call the backend
    const response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: !body ? undefined : isFormData ? body : JSON.stringify(body),
    });

    // If the answer is not JSON, use an empty object
    const data = await response.json().catch(() => ({}));

    // The token is wrong or expired: log the user out
    if (auth && response.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }

    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    // The server is off or there is no internet
    return {
      ok: false,
      status: 0,
      data: {
        status: false,
        message: "Cannot reach the server. Please check your internet and try again.",
      },
    };
  }
}

// Asks the backend to email a new verification code
export function resendVerificationCode(email) {
  return api("/auth/resend-verification", {
    method: "POST",
    body: { email },
  });
}