<script>
  let messages = [];
  let inputMessage = "";
  let expanded = false;
  let selectedModel = "gpt-4o-mini"; // Default model

  const models = ["gpt-3.5-turbo", "gpt-4o", "gpt-4o-mini"]; // List of available models

  const toggleSettings = () => {
    expanded = !expanded;
  };

  async function sendMessage() {
    if (inputMessage.trim()) {
      messages = [...messages, { role: "user", text: inputMessage }];
      const userMessage = inputMessage;
      inputMessage = "";

      try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: selectedModel, // Use the selected model
            messages: messages.map((msg) => ({
              role: msg.role === "ai" ? "assistant" : msg.role,
              content: msg.text,
            })),
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        const aiResponse = data.choices[0].message.content;
        messages = [...messages, { role: "ai", text: aiResponse }];
      } catch (error) {
        console.error("Error calling OpenAI API:", error);
        messages = [...messages, { role: "ai", text: "Sorry, I encountered an error. Please try again." }];
      }
    }
  }
</script>

<style>
  /* Basic styles for messages */
  .message {
    max-width: 75%;
    padding: 10px 18px;
    border-radius: 12px;
    word-wrap: break-word;
    font-size: 1rem;
    line-height: 1.4;
  }
  .user {
    background-color: #3b82f6;
    color: white;
    align-self: flex-end;
  }
  .ai {
    background-color: #e5e7eb;
    color: black;
    align-self: flex-start;
  }

  /* Transition for sliding sidebar and chat */
  .transition-transform {
    transition: transform 0.2s ease;
  }

  /* Header styles */
  header {
    position: relative;
    z-index: 10;
  }

  /* Sidebar Styles */
  .sidebar {
    position: fixed;
    top: 4rem;
    left: 0;
    width: 250px;
    height: 100%;
    background-color: white;
    box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
    padding: 20px;
    transition: transform 0.3s ease;
    transform: translateX(-100%);
  }
  .sidebar.active {
    transform: translateX(0);
  }

  /* Chat Container */
  .chat-container {
    padding: 16px;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    margin-left: var(--sidebar-width, 0); /* Dynamically adjust margin */
    transition: margin-left 0.3s ease;
  }

  .chat-input {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px;
    background-color: #f9fafb;
    border-top: 1px solid #e5e7eb;
  }

  /* Input box now takes up remaining width minus the button */
  .chat-input input {
    flex-grow: 1;
    padding: 8px;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
    width: calc(100% - 80px); /* Takes up the width minus the Send button width */
  }

  .chat-input button {
    padding: 8px 16px;
    background-color: #3b82f6;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: background-color 0.3s;
  }

  .chat-input button:hover {
    background-color: #2563eb;
  }
</style>

<div class="flex flex-col h-screen bg-gray-100">
  <!-- Header -->
  <header class="bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-4 shadow-md">
    <h1 class="text-2xl font-extrabold tracking-wide text-center">AI Chat</h1>
    <button
      on:click={toggleSettings}
      class="absolute top-3 pb-3 left-3 w-10 h-10 bg-white text-blue-500 text-2xl font-bold rounded-full flex items-center justify-center shadow-lg hover:bg-gray-200"
    >
      ...
    </button>
  </header>

  <!-- Sidebar (Settings) -->
  <div class={`sidebar ${expanded ? 'active' : ''}`}>
    <h2 class="text-xl font-bold mb-4">Settings</h2>
    <div class="mb-4">
      <label for="model" class="block text-gray-700 font-medium mb-2">Select Model</label>
      <select
        id="model"
        bind:value={selectedModel}
        class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
      >
        {#each models as model}
          <option value={model}>{model}</option>
        {/each}
      </select>
    </div>
  </div>

  <!-- Chat Container -->
  <div class="chat-container" style="--sidebar-width: {expanded ? '250px' : '0'};">
    <!-- Messages -->
    <div class="flex-grow overflow-y-auto space-y-4">
      {#each messages as { role, text }}
        <div class="flex {role === 'user' ? 'justify-end' : 'justify-start'}">
          <div class="message {role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-black'}">
            {text}
          </div>
        </div>
      {/each}
    </div>

    <!-- Input Box -->
    <div class="chat-input">
      <input
        type="text"
        bind:value={inputMessage}
        placeholder="Type a message..."
        on:keypress={(e) => e.key === 'Enter' && sendMessage()}
      />
      <button on:click={sendMessage}>Send</button>
    </div>
  </div>
</div>