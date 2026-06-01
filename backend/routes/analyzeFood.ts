import { Router, Request, Response } from "express";

const router = Router();

const PROMPT = `
You are a strict nutrition analysis API.

Analyze ONLY edible foods visible in the image.

Rules:
- Return ONLY valid JSON
- No markdown
- No explanations
- No commentary
- No code blocks
- Use realistic serving sizes
- Never output 0 calories for visible foods

Return EXACTLY:

{
  "foods":[
    {
      "name":"string",
      "portion":"string",
      "calories":0,
      "protein":0,
      "carbs":0,
      "fat":0
    }
  ],
  "totalCalories":0,
  "totalProtein":0,
  "totalCarbs":0,
  "totalFat":0
}
`;

function parseCFResponse(resultPayload: any): any {
  if (!resultPayload) {
    throw new Error("Empty response from Cloudflare Workers AI");
  }

  const responseVal = resultPayload.result?.response;
  if (!responseVal) {
    throw new Error("No response content found in Cloudflare result");
  }

  // 1. Direct JSON object response
  if (typeof responseVal === "object" && responseVal !== null) {
    return responseVal;
  }

  // 2. String response with embedded JSON
  if (typeof responseVal === "string") {
    const trimmed = responseVal.trim();
    // Try direct parse
    try {
      return JSON.parse(trimmed);
    } catch (e) {
      console.warn("Direct JSON parse failed, trying regex extraction:", e);
    }

    // Regex extraction fallback: look for content between curly braces
    const jsonRegex = /({[\s\S]*})/;
    const match = jsonRegex.exec(trimmed);
    if (match && match[1]) {
      try {
        return JSON.parse(match[1].trim());
      } catch (e) {
        console.error("Regex JSON parse failed:", e);
      }
    }
  }

  throw new Error(`Failed to parse nutrition JSON from response: ${JSON.stringify(responseVal)}`);
}

router.post(
  "/analyze-food",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { base64, mimeType } = req.body;
      if (!base64) {
        res.status(400).json({ error: "No image base64 data provided" });
        return;
      }

      const cleanBase64 = base64.replace(/^data:image\/\w+;base64,/, "");
      console.log("base64 length:", cleanBase64.length);
      console.log("base64 start:", cleanBase64.substring(0, 20));

      const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
      const CF_API_TOKEN = process.env.CF_API_TOKEN;

      if (!CF_ACCOUNT_ID || !CF_API_TOKEN) {
        res.status(500).json({ error: "Cloudflare credentials are not configured on the server" });
        return;
      }

      const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/ai/run/@cf/meta/llama-3.2-11b-vision-instruct`;

      // Convert base64 to uint8 number array (required by Cloudflare vision models)
      const imageBytes = Array.from(Buffer.from(cleanBase64, "base64"));

      console.log("Sending request to Cloudflare Workers AI...");
      const cfResponse = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${CF_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: imageBytes,
          prompt: PROMPT,
        }),
      });

      if (!cfResponse.ok) {
        const errorText = await cfResponse.text();
        console.error("Cloudflare API returned error status:", cfResponse.status, errorText);
        res.status(cfResponse.status).json({
          error: `Cloudflare API error (${cfResponse.status}): ${errorText}`,
        });
        return;
      }

      const rawResult = await cfResponse.json();
      console.log("Cloudflare raw response status: success =", rawResult.success);

      try {
        const nutritionData = parseCFResponse(rawResult);
        res.status(200).json(nutritionData);
      } catch (parseError) {
        console.error("Failed to parse Cloudflare response:", parseError, "Raw response:", JSON.stringify(rawResult));
        res.status(500).json({
          error: parseError instanceof Error ? parseError.message : "Failed to parse response from Cloudflare Workers AI",
        });
      }
    } catch (error) {
      console.error("Error in analyze-food:", error);
      res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to analyze food image",
      });
    }
  }
);

export default router;
