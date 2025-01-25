<script lang="ts">
  import { onMount } from 'svelte';

  let audioElement: HTMLAudioElement;
  let status = 'Initializing...';
  let transcriptMessages = [];
  let selectedVoice = 'alloy'; // Default voice selection

  async function initVoiceAssistant(selectedVoice: string) {
    status = 'Fetching ephemeral key...';
    const tokenResponse = await fetch(`/api/session?voice=${selectedVoice}`); // Pass the selected voice to the API
    const data = await tokenResponse.json();
    const EPHEMERAL_KEY = data.client_secret.value;

    status = 'Setting up WebRTC connection...';
    const pc = new RTCPeerConnection();

    audioElement.srcObject = new MediaStream();
    pc.ontrack = e => {
      (audioElement.srcObject as MediaStream).addTrack(e.track);
    };

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    const dc = pc.createDataChannel("oai-events");
    dc.onmessage = handleServerMessage;

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    status = 'Connecting to OpenAI Realtime API...';
    const sdpResponse = await fetch(`https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17`, {
      method: "POST",
      body: offer.sdp,
      headers: {
        Authorization: `Bearer ${EPHEMERAL_KEY}`,
        "Content-Type": "application/sdp",
      },
    });

    const answer: RTCSessionDescriptionInit = {
      type: 'answer' as RTCSdpType,
      sdp: await sdpResponse.text()
    };

    await pc.setRemoteDescription(answer);

    status = 'Connected!';
    return { pc, dc };
  }

  function handleServerMessage(event) {
  try {
    const message = JSON.parse(event.data);
    
    if (message.type === 'conversation.item.input_audio_transcription.completed') {
      transcriptMessages = [...transcriptMessages, { role: "user", content: message.transcript }];
    } else if (message.type === 'response.audio_transcript.done') {
      transcriptMessages = [...transcriptMessages, { role: "assistant", content: message.transcript }];
    } 
  } catch (error) {
    console.error("Error parsing message data:", error);
  }
}

  function sendMessage(dc, message) {
    if (dc.readyState === 'open') {
      dc.send(JSON.stringify(message));
    } 
  }

  onMount(async () => {
    const { dc } = await initVoiceAssistant(selectedVoice);
    sendMessage(dc, {
      type: "response.create",
      response: {
        modalities: ["text", "audio"],
        instructions: "respond helpfully.",
      },
    });
  });

  let isExpanded = true;

function toggleTranscript() {
  isExpanded = !isExpanded;
}
</script>


<main class="min-h-screen flex flex-col items-center bg-gray-50 py-8 relative">
  <h1 class="text-4xl font-semibold mb-6 text-blue-600">Voice Assistant</h1>
  
  <!-- Connection Status -->
  <p class="absolute top-1 right-2 text-med font-smnall text-gray-700">Status: {status}</p>

  <div class="mb-6 w-full max-w-xs">
    <label for="voiceSelect" class="block text-lg font-medium text-gray-700 mb-2">Select Voice:</label>
    <select id="voiceSelect" bind:value={selectedVoice} on:change={() => { initVoiceAssistant(selectedVoice); }} 
      class="mt-1 p-3 w-full rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg bg-white shadow-sm hover:border-blue-400 focus:border-blue-500 transition duration-200 ease-in-out">
      <option value="" disabled selected>Select a voice</option>
      <option value="alloy">Alloy</option>
      <option value="ash">Ash</option>
      <option value="ballad">Ballad</option>
      <option value="coral">Coral</option>
      <option value="echo">Echo</option>
      <option value="sage">Sage</option>
      <option value="shimmer">Shimmer</option>
      <option value="verse">Verse</option>
    </select>
  </div>
  
  <audio bind:this={audioElement} autoplay class="hidden"></audio>
  
  <div class="w-full max-w-2xl bg-white rounded-lg shadow-lg p-6 mt-8">
    <h3 class="text-xl font-semibold mb-4">Transcript</h3>
    
    <div class="relative">
      <!-- Arrow Button to Toggle Transcript -->
      <button
      on:click={toggleTranscript}
      class="absolute top-[-32px] right-4 text-gray-500 hover:text-blue-500 focus:outline-none transform transition-transform duration-200"
      aria-label={isExpanded ? 'Collapse transcript' : 'Expand transcript'}>
      <span class={`inline-block w-4 h-4 border-t-2 border-r-2 transform ${isExpanded ? '-rotate-45' : 'rotate-90'} origin-center`}></span>
    </button>
    
    <!-- Transcript Messages -->
    {#if isExpanded}
      <div class="flex flex-col space-y-4 h-80 overflow-y-auto mt-4">
        {#each transcriptMessages as { role, content }}
          <div class={`flex ${role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div class={`max-w-3/4 px-4 py-2 rounded-lg break-words ${role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-black'}`}>
              {content}
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</main>
