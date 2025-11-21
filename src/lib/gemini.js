import { GoogleGenerativeAI } from "@google/generative-ai";

// Rate limiting configuration
const RATE_LIMIT = {
    maxRequests: 10, // Max requests per minute (safe buffer below 15)
    windowMs: 60000, // 1 minute
    requestTimestamps: []
};

// Check if we can make a request
const checkRateLimit = () => {
    const now = Date.now();
    // Remove timestamps older than the window
    RATE_LIMIT.requestTimestamps = RATE_LIMIT.requestTimestamps.filter(
        timestamp => now - timestamp < RATE_LIMIT.windowMs
    );

    if (RATE_LIMIT.requestTimestamps.length >= RATE_LIMIT.maxRequests) {
        return false;
    }

    RATE_LIMIT.requestTimestamps.push(now);
    return true;
};

let genAI = null;
let model = null;

export const initializeGemini = (apiKey) => {
    if (!apiKey) return false;
    try {
        genAI = new GoogleGenerativeAI(apiKey);
        model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        return true;
    } catch (error) {
        console.error("Failed to initialize Gemini:", error);
        return false;
    }
};

export const isGeminiInitialized = () => !!model;

const getSystemPrompt = (data) => {
    // Format large numbers for better readability
    const fmt = (num) => new Intl.NumberFormat('en-US').format(Math.round(num));

    return `
You are a financial analyst assistant. You are analyzing Profit & Loss (P&L) data.
Here is the summary of the financial data:
Total Revenue (Credit): ${fmt(data.totalCredit)}
Total Expenses (Debit): ${fmt(data.totalDebit)}
Net Income: ${fmt(data.netIncome)}
Profit Margin: ${data.profitMargin.toFixed(2)}%

Top Revenue Accounts: ${data.topRevenueAccounts.map(a => `${a.name} (${fmt(a.value)})`).join(', ')}
Top Expense Accounts: ${data.topExpenseAccounts.map(a => `${a.name} (${fmt(a.value)})`).join(', ')}
Top Profit Departments: ${data.topProfitDepartments.map(d => `${d.name} (${fmt(d.net)})`).join(', ')}

Monthly Trend:
${data.monthlyChartData.map(m => `${m.name}: Rev ${fmt(m.credit)}, Exp ${fmt(m.debit)}, Net ${fmt(m.net)}`).join('\n')}

Region Performance:
${data.regionChartData.map(r => `${r.name}: Net ${fmt(r.net)}`).join(', ')}

Store Type Performance:
${data.storeTypeNetIncomeData.map(s => `${s.name}: Net ${fmt(s.realValue)}`).join(', ')}

Please provide concise, professional, and actionable insights based on this data.
**IMPORTANT: You must answer in Traditional Chinese (繁體中文).**
When answering questions, be specific and use the provided numbers.
If the user asks about something not in the data, politely say you don't have that information.
  `;
};

export const generateInsights = async (data) => {
    if (!model) throw new Error("AI not initialized");
    if (!checkRateLimit()) throw new Error("Rate limit exceeded. Please wait a moment.");

    const prompt = `
    Based on the provided financial data, please generate 3-5 key insights.
    Focus on:
    1. Overall financial health
    2. Significant trends (revenue or expense changes)
    3. Areas of concern (high expenses or low margins)
    4. Top performing areas
    
    **IMPORTANT: The output must be a JSON array of strings in Traditional Chinese (繁體中文).**
    Example: ["本月營收成長 10%", "支出主要集中在人事成本"]
    
    Format the output as a JSON array of strings.
    Do not include markdown formatting like \`\`\`json. Just return the raw JSON string.
  `;

    const systemPrompt = getSystemPrompt(data);

    try {
        const result = await model.generateContent([systemPrompt, prompt]);
        const response = await result.response;
        const text = response.text();
        // Clean up potential markdown code blocks
        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        try {
            return JSON.parse(cleanText);
        } catch (e) {
            // Fallback if JSON parsing fails, return raw text split by newlines
            return cleanText.split('\n').filter(line => line.trim().length > 0);
        }
    } catch (error) {
        console.error("Error generating insights:", error);
        throw error;
    }
};

export const askQuestion = async (data, question) => {
    if (!model) throw new Error("AI not initialized");
    if (!checkRateLimit()) throw new Error("Rate limit exceeded. Please wait a moment.");

    const systemPrompt = getSystemPrompt(data);

    try {
        const result = await model.generateContent([systemPrompt, question]);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Error answering question:", error);
        throw error;
    }
};
