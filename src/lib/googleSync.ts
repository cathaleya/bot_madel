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

  // Format answers array so each item is a raw number score (prevents [object Object] in Google Sheets)
  let formattedAnswers = data.answers;
  if (typeof formattedAnswers === 'string') {
    try { formattedAnswers = JSON.parse(formattedAnswers); } catch (e) {}
  }

  if (Array.isArray(formattedAnswers)) {
    formattedAnswers = formattedAnswers.map((item: any) => {
      if (typeof item === 'object' && item !== null) {
        return item.score !== undefined ? item.score : (item.val || item.value || JSON.stringify(item));
      }
      return item;
    });
  }

  try {
    const payload = {
      ...data,
      answers: formattedAnswers
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
