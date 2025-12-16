import { GoogleGenAI } from "@google/genai";

const getClient = () => {
    // NOTE: In a real production app, never expose API keys in frontend code.
    // This is for demonstration purposes as per prompt requirements to use process.env.API_KEY.
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        throw new Error("API Key is missing.");
    }
    return new GoogleGenAI({ apiKey });
};

export const analyzeFile = async (file: File): Promise<string> => {
    try {
        const ai = getClient();
        const isImage = file.type.startsWith('image/');
        const isText = file.type.startsWith('text/') || file.type === 'application/json';

        if (!isImage && !isText) {
            return "File type not supported for AI preview.";
        }

        let model = 'gemini-2.5-flash';
        let prompt = '';
        let parts: any[] = [];

        if (isImage) {
            // Convert image to base64
            const base64Data = await fileToGenerativePart(file);
            prompt = "Provide a very short, cheerful, 1-sentence description of this image for a file transfer preview.";
            parts = [
                { inlineData: { data: base64Data, mimeType: file.type } },
                { text: prompt }
            ];
        } else if (isText) {
            const textContent = await file.text();
            // Truncate if too long to save tokens/time
            const truncatedText = textContent.slice(0, 10000);
            prompt = "Summarize the following text file content in one concise sentence (max 20 words):";
            parts = [
                { text: `${prompt}\n\n${truncatedText}` }
            ];
        }

        const response = await ai.models.generateContent({
            model: model,
            contents: { parts }
        });

        return response.text || "No insights available.";

    } catch (error) {
        console.error("Gemini Error:", error);
        return "AI analysis unavailable.";
    }
};

async function fileToGenerativePart(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = (reader.result as string).split(',')[1];
            resolve(base64String);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}