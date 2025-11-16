
import { GoogleGenAI, GenerateContentResponse, Part } from "@google/genai";
import { SlideContent, ExtractedPdfPage } from '../types';

const API_KEY = process.env.API_KEY;

let ai: GoogleGenAI | null = null;

if (API_KEY) {
  ai = new GoogleGenAI({ apiKey: API_KEY });
} else {
  console.error("Gemini API Key (process.env.API_KEY) is not set. AI functionality will be disabled.");
}

export async function generateSlideContent(page: ExtractedPdfPage): Promise<SlideContent> {
  if (!ai) {
    throw new Error("Gemini AI client is not initialized. API Key might be missing.");
  }
  
  const modelName = "gemini-2.5-flash-preview-04-17";

  // Handle empty page case upfront
  if (!page.imageData && (!page.text || page.text.trim().length === 0)) {
     console.warn(`Page ${page.pageNumber} has no content (text or image) for slide generation.`);
     return {
        title: "Empty Page",
        points: ["This page had no discernible content for a slide."],
        notes: `Original page ${page.pageNumber} was empty or content too sparse.`,
     };
  }
  
  let promptMessage = `You are an expert presentation creator. Your task is to generate content for a single PowerPoint slide based on information extracted from a PDF page. The goal is to make the slide understandable and engaging, using any provided image as a key explanatory element.

Your main tasks:
1.  Create a concise and engaging TITLE for the slide.
    - If an image is provided, the title MUST primarily reflect the image's content or the main concept it illustrates.
    - If only text is provided, base the title on the key themes of the text.
2.  Generate 0 to 4 key BULLET POINTS.
    - If an image is provided, these points MUST explain, describe, or elaborate on what the image depicts or its relevance. They should help the audience understand the image's significance. Connect to accompanying text if it adds value.
    - If only text is provided, the points should summarize the main ideas or arguments from the text.
    - Ensure bullet points are distinct, informative, and brief.
3.  Generate detailed SPEAKER NOTES.
    - These notes are for the presenter to read from. They should provide more context, detail, and explanation than the bullet points.
    - Expand on the bullet points, explain the significance of the image, and provide background information from the source text that didn't fit on the slide itself.
    - The notes should be a few sentences or a short paragraph.
4.  If an image is provided, generate a descriptive ALT TEXT for accessibility. This text should concisely describe the visual content of the image.

Output Format:
Respond STRICTLY with a JSON object containing:
- "title": (string) The slide title.
- "points": (array of strings) The bullet points. (e.g., ["Point 1", "Point 2"])
- "notes": (string) The speaker notes for the presenter.
- "imageAltText": (string, optional) A description of the image for accessibility. ONLY include this field if an image is provided.

Input Content Analysis & Instructions:
`;

  const finalContentParts: Part[] = [];

  if (page.imageData && page.imageMimeType) {
    promptMessage += "- An IMAGE is provided. This image is central. Your title, points, and alt text should revolve around or clearly reference this image.\n";
  }

  if (page.text && page.text.trim().length > 0) {
    const textPreview = page.text.substring(0, 150).replace(/\s+/g, ' ').trim(); // Show a slightly longer preview for context
    promptMessage += `- TEXT from the page is also provided (preview: "${textPreview}..."). Use this for context or summarization. If an image is present, ensure the text elements complement the image-focused explanation.\n`;
  }
  promptMessage += "\nNow, based on the image (if any) and text (if any) that will be provided as separate data parts following this instruction, generate the JSON response.";

  finalContentParts.push({ text: promptMessage });


  if (page.imageData && page.imageMimeType) {
    // Remove "data:image/...;base64," prefix
    const base64Data = page.imageData.substring(page.imageData.indexOf(',') + 1);
    finalContentParts.push({
      inlineData: {
        mimeType: page.imageMimeType,
        data: base64Data
      }
    });
  }

  if (page.text && page.text.trim().length > 0) {
    // Limit text length to avoid excessive token usage and keep focus.
    const textForPrompt = page.text.substring(0, page.imageData ? 5000 : 15000); 
    finalContentParts.push({text: `\n\n---BEGIN PDF PAGE TEXT---\n${textForPrompt}\n---END PDF PAGE TEXT---`});
  }


  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: modelName,
      contents: { parts: finalContentParts },
      config: {
        responseMimeType: "application/json",
      }
    });

    let jsonStr = response.text.trim();
    const fenceRegex = /^```(?:json)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[1]) {
      jsonStr = match[1].trim();
    }

    // Basic validation for JSON structure
    if (!jsonStr.startsWith("{") || !jsonStr.endsWith("}")) {
        console.warn(`Gemini response is not a valid JSON object string. Page: ${page.pageNumber}, Response:`, jsonStr);
        return { 
          title: "AI Response Format Error", 
          points: ["Could not parse AI's response structure.", `Raw response (preview): ${jsonStr.substring(0, 100)}...`],
          imageData: page.imageData, imageMimeType: page.imageMimeType,
          notes: `Original text (preview): ${page.text.substring(0,100)}... Page ${page.pageNumber}.`
        };
    }
    
    const parsed = JSON.parse(jsonStr) as Partial<SlideContent>;

    return {
      title: parsed.title || (page.imageData ? `Image from Page ${page.pageNumber}` : `Content from Page ${page.pageNumber}`),
      points: Array.isArray(parsed.points) ? parsed.points : [],
      imageData: page.imageData, // Carry image data forward
      imageMimeType: page.imageMimeType, // Carry mime type forward
      imageAltText: parsed.imageAltText, // New field for alt text
      notes: parsed.notes // AI-generated speaker notes
    };

  } catch (error) {
    console.error(`Error generating slide content from Gemini for page ${page.pageNumber}:`, error);
    let errorMessage = "Failed to generate slide content due to an AI API error.";
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return {
      title: "Error Processing Content",
      points: [`AI Error on page ${page.pageNumber}: ${errorMessage.substring(0,150)}`],
      imageData: page.imageData, imageMimeType: page.imageMimeType,
      notes: `Error on page ${page.pageNumber}. Full Error: ${error instanceof Error ? error.message : String(error)}. Original text (first 100 chars): ${page.text.substring(0, 100)}...`
    };
  }
}
