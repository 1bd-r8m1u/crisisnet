import { GoogleGenAI, Type } from "@google/genai";
import { Patient, SupplyStock } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Model selection based on task complexity
const FLASH_MODEL = 'gemini-2.5-flash';
const PRO_MODEL = 'gemini-3-pro-preview';

const calculateAge = (dateOfBirth: string): number => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

/**
 * Assists doctors with differential diagnosis or treatment suggestions based on patient data.
 */
export const getMedicalAssistantResponse = async (
  symptoms: string,
  patientHistory: Patient
): Promise<string> => {
  if (!apiKey) return "AI Unavailable: No API Key";

  const age = calculateAge(patientHistory.dateOfBirth);

  const prompt = `
    You are a crisis field medical assistant. 
    Patient Profile:
    - Age: ${age}
    - Conditions: ${patientHistory.conditions.join(', ') || 'None'}
    - Allergies: ${patientHistory.allergies.join(', ') || 'None'}
    
    Current Symptoms/Input: "${symptoms}"

    Provide a brief, bulleted list of potential differential diagnoses and immediate actions relevant to a resource-constrained crisis zone. 
    Keep it under 150 words.
  `;

  try {
    const response = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: prompt,
      config: {
        systemInstruction: "You are a helpful, concise medical assistant for crisis zones. Prioritize life-saving advice.",
        maxOutputTokens: 300,
      }
    });
    return response.text || "No response generated.";
  } catch (error) {
    console.error("Gemini Medical Error:", error);
    return "Error generating medical advice. Proceed with standard protocols.";
  }
};

/**
 * Analyzes aggregated data for the Director to identify outbreaks or supply risks.
 */
export const getStrategicSituationReport = async (
  patients: Patient[],
  supplies: SupplyStock[]
): Promise<{ summary: string; recommendations: string[] }> => {
  if (!apiKey) return { summary: "AI Offline", recommendations: [] };

  // Anonymize and aggregate data for the prompt
  const conditions = patients.flatMap(p => p.conditions);
  const criticalCount = patients.filter(p => p.status === 'CRITICAL').length;
  const lowSupplies = supplies.filter(s => s.quantity < s.criticalThreshold).map(s => s.item);

  const prompt = `
    Analyze the following crisis network data:
    - Total Patients: ${patients.length}
    - Critical Condition: ${criticalCount}
    - Reported Conditions: ${JSON.stringify(conditions.slice(0, 50))}
    - Low Supplies: ${lowSupplies.join(', ')}

    Output a JSON object with two fields:
    1. "summary": A strategic overview of the health situation (max 3 sentences).
    2. "recommendations": An array of 3 specific tactical actions for the director.
  `;

  try {
    const response = await ai.models.generateContent({
      model: PRO_MODEL, // Using Pro for reasoning over aggregated data
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            recommendations: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          }
        }
      }
    });

    const json = JSON.parse(response.text || "{}");
    return {
      summary: json.summary || "Analysis failed.",
      recommendations: json.recommendations || []
    };
  } catch (error) {
    console.error("Gemini Strategy Error:", error);
    return { summary: "Error analyzing data.", recommendations: ["Check manual logs."] };
  }
};
