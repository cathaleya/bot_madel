/**
 * Google Sheets Sync Utility
 * Sends assessment and survey data to Google Sheets via Webhook
 */

export async function syncToGoogleSheets(data: {
  userId: string;
  name: string;
  type: string;
  score: number;
  gender?: string;
  campus?: string;
  answers: any;
  feedback?: string;
}) {
  const WEBHOOK_URL = process.env.NEXT_PUBLIC_GOOGLE_SHEETS_URL;
  
  if (!WEBHOOK_URL) {
    console.warn("Google Sheets Webhook URL not configured. Skipping sync.");
    return;
  }

  // Parse raw answers into a flat array of primitive numbers
  let raw = data.answers;
  if (typeof raw === 'string') {
    try { raw = JSON.parse(raw); } catch (e) {}
  }

  let numberArray: number[] = [];

  if (Array.isArray(raw)) {
    numberArray = raw.map((item: any) => {
      if (typeof item === 'object' && item !== null) {
        if (item.score !== undefined) return Number(item.score);
        if (item.value !== undefined) return Number(item.value);
        if (item.val !== undefined) return Number(item.val);
      }
      const num = Number(item);
      return isNaN(num) ? 0 : num;
    });
  } else if (typeof raw === 'object' && raw !== null) {
    // Sort keys numerically if possible (e.g., "0", "1", "2" or "q1", "q2")
    const keys = Object.keys(raw).sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, ''), 10);
      const numB = parseInt(b.replace(/\D/g, ''), 10);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.localeCompare(b);
    });

    numberArray = keys.map((k) => {
      const item = raw[k];
      if (typeof item === 'object' && item !== null) {
        if (item.score !== undefined) return Number(item.score);
        if (item.value !== undefined) return Number(item.value);
        if (item.val !== undefined) return Number(item.val);
      }
      const num = Number(item);
      return isNaN(num) ? 0 : num;
    });
  }

  // Create explicit q1..q30 and Q1..Q30 properties as primitive numbers
  const extraQFields: Record<string, number> = {};
  numberArray.forEach((val, idx) => {
    extraQFields[`q${idx + 1}`] = val;
    extraQFields[`Q${idx + 1}`] = val;
  });

  try {
    const payload = {
      ...data,
      ...extraQFields,
      answers: numberArray,
      answersList: numberArray
    };

    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      mode: 'no-cors'
    });
    console.log("Data synced to Google Sheets successfully.");
  } catch (error) {
    console.error("Failed to sync to Google Sheets:", error);
  }
}
