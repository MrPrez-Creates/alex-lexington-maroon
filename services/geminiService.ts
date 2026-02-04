
import { GoogleGenAI, Type } from "@google/genai";
import { MetalType, AssetForm, Address } from '../types';

const getClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

interface ExtractedData {
  metalType: string;
  form: string;
  weightAmount: number;
  weightUnit: string;
  quantity: number;
  purchasePrice: number;
  acquiredAt: string;
  name: string;
  purity: string;
  mint: string;
  mintage: string;
}

export const scanInvoice = async (base64Image: string): Promise<ExtractedData | null> => {
  try {
    const ai = getClient();
    
    const prompt = `
      Analyze this image. It is either:
      1. A physical precious metal item (coin, bar, round).
      2. An invoice/receipt for precious metals.
      
      Extract the following details. If scanning a physical item, estimate details based on visual markings.
      
      1. Metal Type (gold, silver, platinum, palladium) - Lowercase.
      2. Form (Coin, Bar, Round, Jewelry)
      3. Weight Amount (e.g. 1, 10, 31.1)
      4. Weight Unit (e.g. oz, g, kg)
      5. Quantity. (Default to 1).
      6. Total Purchase Price/Cost. (If physical item scan, leave as 0).
      7. Acquired Date (YYYY-MM-DD). (If physical scan, use today).
      8. Item Name/Description (e.g., "1 oz Gold Bar PAMP Fortuna").
      9. Purity (e.g., .999, .9999).
      10. Mint/Manufacturer (e.g., PAMP Suisse).
      
      Return JSON only.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image
            }
          },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            metalType: { type: Type.STRING, enum: Object.values(MetalType) },
            form: { type: Type.STRING, enum: Object.values(AssetForm) },
            weightAmount: { type: Type.NUMBER, description: "Numeric weight value" },
            weightUnit: { type: Type.STRING, description: "Unit string e.g. oz, g" },
            quantity: { type: Type.NUMBER, description: "Number of units" },
            purchasePrice: { type: Type.NUMBER, description: "Total cost found on invoice" },
            acquiredAt: { type: Type.STRING, description: "YYYY-MM-DD" },
            name: { type: Type.STRING },
            purity: { type: Type.STRING },
            mint: { type: Type.STRING },
            mintage: { type: Type.STRING }
          },
          required: ["metalType", "weightAmount", "quantity"]
        }
      }
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(text) as ExtractedData;

  } catch (error) {
    console.error("Gemini Scan Error:", error);
    throw new Error("Failed to analyze image.");
  }
};

export const verifyAddress = async (address: Address): Promise<{ verifiedAddress: Address, isFound: boolean }> => {
  try {
    const ai = getClient();
    const addressString = `${address.street} ${address.street2 || ''}, ${address.city}, ${address.state} ${address.zip}, ${address.country}`;
    
    // Step 1: Verification via Google Maps Tool (Text Response)
    // We can't use JSON Schema with tools yet in the same call efficiently for this specific SDK version behavior in some contexts,
    // but we can ask it to find the place and describe it.
    const verificationResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Use Google Maps to verify if this address exists and find the official postal format: "${addressString}".
      If the address is valid, provide the standardized address. 
      If it is a business or organization, mention that.
      If it is invalid or ambiguous, explain why.`,
      config: {
        tools: [{ googleMaps: {} }],
      }
    });

    const verifiedText = verificationResponse.text;
    if (!verifiedText) throw new Error("Could not verify address.");

    // Step 2: Extract Structure into JSON
    // Use gemini-2.5-flash-lite for faster processing of the text result
    const extractionResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: `Based on the following verification report, extract the standardized address components into JSON.
      
      Verification Report: "${verifiedText}"
      
      User Input was: ${JSON.stringify(address)}

      If the address was found and corrected, use the corrected values.
      If the address was NOT found, return the User Input values but set 'found' to false.
      
      Return JSON only.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            street: { type: Type.STRING },
            street2: { type: Type.STRING, description: "Apartment, Suite, Unit, etc." },
            city: { type: Type.STRING },
            state: { type: Type.STRING },
            zip: { type: Type.STRING },
            country: { type: Type.STRING },
            found: { type: Type.BOOLEAN }
          },
          required: ["street", "city", "country", "found"]
        }
      }
    });
    
    const result = JSON.parse(extractionResponse.text || "{}");
    
    return {
        verifiedAddress: {
            street: result.street || address.street,
            street2: result.street2 || address.street2 || '',
            city: result.city || address.city,
            state: result.state || address.state,
            zip: result.zip || address.zip,
            country: result.country || address.country
        },
        isFound: result.found !== false // Default to true unless explicitly false
    };

  } catch (error) {
    console.error("Address Verification Error:", error);
    throw new Error("AI Verification Unavailable");
  }
};
