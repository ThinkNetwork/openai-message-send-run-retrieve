window.function = async function(api_key, thread_id, assistant_id, content) {
    if (!api_key.value) return "Error: OpenAI API Key is required.";
    if (!thread_id.value) return "Error: Thread ID is required.";
    if (!assistant_id.value) return "Error: Assistant ID is required.";
    if (!content.value) return "Error: Message content is required.";

    const OPENAI_API_KEY = api_key.value;
    const openaiEndpoint = "https://api.openai.com/v1";

    try {
        // Step 1: Send a message to the thread
        const messagePayload = {
            role: "user",
            content: content.value
        };

        const messageResponse = await fetch(`${openaiEndpoint}/threads/${thread_id.value}/messages`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${OPENAI_API_KEY}`,
                "OpenAI-Beta": "assistants=v2"
            },
            body: JSON.stringify(messagePayload)
        });

        if (!messageResponse.ok) {
            const errorData = await messageResponse.json();
            throw new Error(`Message Error: ${errorData.error?.message || "Unknown error"}`);
        }

        // Step 2: Create a run for the assistant
        const runPayload = { assistant_id: assistant_id.value };

        const runResponse = await fetch(`${openaiEndpoint}/threads/${thread_id.value}/runs`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${OPENAI_API_KEY}`,
                "OpenAI-Beta": "assistants=v2"
            },
            body: JSON.stringify(runPayload)
        });

        if (!runResponse.ok) {
            const errorData = await runResponse.json();
            throw new Error(`Run Error: ${errorData.error?.message || "Unknown error"}`);
        }

        const runData = await runResponse.json();
        const runId = runData.id;

        // Step 3: Poll until the run is completed
        let runStatus = "queued";
        while (runStatus !== "completed") {
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for 2 seconds before checking status

            const runStatusResponse = await fetch(`${openaiEndpoint}/threads/${thread_id.value}/runs/${runId}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${OPENAI_API_KEY}`,
                    "OpenAI-Beta": "assistants=v2"
                }
            });

            if (!runStatusResponse.ok) {
                const errorData = await runStatusResponse.json();
                throw new Error(`Run Status Error: ${errorData.error?.message || "Unknown error"}`);
            }

            const runStatusData = await runStatusResponse.json();
            runStatus = runStatusData.status;

            if (runStatus === "failed") {
                throw new Error("Run failed.");
            }
        }

        // Step 4: Retrieve the assistant's response message
        const messagesResponse = await fetch(`${openaiEndpoint}/threads/${thread_id.value}/messages`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${OPENAI_API_KEY}`,
                "OpenAI-Beta": "assistants=v2"
            }
        });

        if (!messagesResponse.ok) {
            const errorData = await messagesResponse.json();
            throw new Error(`Messages Retrieval Error: ${errorData.error?.message || "Unknown error"}`);
        }

        const messagesData = await messagesResponse.json();

        // Find the latest assistant response
        const assistantMessage = messagesData.data
            .filter(msg => msg.role === "assistant")
            .pop()?.content || "No response from assistant.";

        return assistantMessage;

    } catch (error) {
        return `Error: ${error.message}`;
    }
};
