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
                "Authorization": `Bearer ${OPENAI_API_KEY}`
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
                "Authorization": `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify(runPayload)
        });

        if (!runResponse.ok) {
            const errorData = await runResponse.json();
            throw new Error(`Run Error: ${errorData.error?.message || "Unknown error"}`);
        }

        // Step 3: Retrieve the assistant's response message
        const messagesResponse = await fetch(`${openaiEndpoint}/threads/${thread_id.value}/messages`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${OPENAI_API_KEY}`
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
