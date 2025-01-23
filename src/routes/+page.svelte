<script>
  let messages = [];
  let inputMessage = "";
  let expanded = false;
  let selectedModel = "gpt-4o-mini"; // Default model
  let temperature = 0.7; // Default temperature

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
            temperature: temperature, // Pass temperature
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

<div class="flex flex-col h-screen bg-gray-100">
  <!-- Header -->
  <header class="bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-4 shadow-md flex items-center justify-between px-4">
    <button
      on:click={toggleSettings}
      class="w-10 h-10 bg-white text-blue-500 pb-3 text-2xl font-bold rounded-full flex items-center justify-center shadow-lg hover:bg-gray-200"
    >
      ...
    </button>
    <h1 class="text-2xl font-extrabold tracking-wide">AI Chat</h1>
  </header>

  <!-- Sidebar (Settings) -->
  <div class={`fixed top-20 left-0 w-64 h-full bg-white shadow-lg p-5 transform transition-transform ${expanded ? 'translate-x-0' : '-translate-x-full'}`}>
    <h2 class="text-xl font-bold mb-4">Settings</h2>
    <div class="mb-4">
      <label for="model" class="block text-gray-700 font-medium mb-2">Select Model</label>
      <select
        id="model"
        bind:value={selectedModel}
        class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
      >
        {#each models as model}
          <option value={model}>{model}</option>
        {/each}
      </select>
    </div>
    <div class="mb-4">
      <label for="temperature" class="block text-gray-700 font-medium mb-2">Temperature ({temperature.toFixed(1)})</label>
      <input
        id="temperature"
        type="range"
        min="0"
        max="1"
        step="0.1"
        bind:value={temperature}
        class="w-full"
      />
    </div>
  </div>

  <!-- Chat Container -->
  <div class="flex flex-col flex-grow p-4 overflow-y-auto transition-all" style="margin-left: {expanded ? '16rem' : '0'};">
    <!-- Messages -->
    <div class="flex-grow overflow-y-auto space-y-4">
      {#each messages as { role, text }}
        <div class="flex {role === 'user' ? 'justify-end' : 'justify-start'}">
          <div class={`max-w-3/4 px-4 py-2 rounded-lg break-words ${role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-black'}`}>
            {text}
          </div>
        </div>
      {/each}
    </div>

    <!-- Input Box -->
    <div class="flex items-center gap-4 bg-gray-50 border-t border-gray-200 p-4">
      <input
        type="text"
        bind:value={inputMessage}
        placeholder="Type a message..."
        on:keypress={(e) => e.key === 'Enter' && sendMessage()}
        class="flex-grow px-3 py-2 border rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
      />
      <button
        on:click={sendMessage}
        class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
      >
        Send
      </button>
    </div>
  </div>
</div>
