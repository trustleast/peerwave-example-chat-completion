import React, { useEffect, useState } from "react";

export const ChatCompletion: React.FC = () => {
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const staticMessage = "Hello! Can you tell me a fun fact about space?";

  const handleChatCompletion = async () => {
    setResponse("");
    setIsLoading(true);
    setError("");
    try {
      const completion = await fetchChatCompletion(staticMessage);
      setResponse(completion);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
    setIsLoading(false);
  };

  // We just loaded the page and are authenticated, so let's get a response!
  useEffect(() => {
    const token = getToken();
    if (token) {
      handleChatCompletion();
    }
  }, []);

  return (
    <>
      {error && <p>{error}</p>}
      <h3>Question:</h3>
      <p>{staticMessage}</p>
      {response && (
        <>
          <h3>Response:</h3>
          <p>{response}</p>
        </>
      )}
      <button disabled={isLoading} onClick={() => handleChatCompletion()}>
        {buttonText(response !== "", isLoading)}
      </button>
    </>
  );
};

function buttonText(hasResponse: boolean, isLoading: boolean): string {
  if (hasResponse) {
    return "Try Again";
  }
  return isLoading ? "Getting Response..." : "Send Message";
}

function getToken(): string | null {
  const hashParams = new URLSearchParams(window.location.hash.substring(1));
  return hashParams.get("token");
}

async function fetchChatCompletion(message: string): Promise<string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Redirect: window.location.pathname + window.location.search,
  };

  // Add Authorization header if we have a token
  const token = getToken();
  if (token) {
    headers["Authorization"] = token;
  }

  const response = await fetch("https://api.peerwave.ai/api/chat", {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: "fastest",
      messages: [
        {
          role: "user",
          content: message,
        },
      ],
    }),
  });

  if (!response.ok) {
    // Handle 402 (Payment Required) or other auth-related status codes
    const location = response.headers.get("Location");
    if (location) {
      // Redirect to Peerwave auth
      window.location.href = location;
      throw new Error("Redirecting to Peerwave auth");
    }
    throw new Error(
      `Failed to get chat completion: ${
        response.status
      } ${await response.text()}`
    );
  }

  const data = await response.json();
  console.log(data);
  return data.message.content;
}
