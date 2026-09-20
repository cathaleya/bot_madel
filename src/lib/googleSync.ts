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

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      mode: 'no-cors' // Google Apps Script requires no-cors for simple redirects
    });
    console.log("Data synced to Google Sheets successfully.");
  } catch (error) {
    console.error("Failed to sync to Google Sheets:", error);
  }
}
