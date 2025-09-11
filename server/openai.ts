import OpenAI from "openai";

/*
Follow these instructions when using this blueprint:
1. Note that the newest OpenAI model is "gpt-5", not "gpt-4o" or "gpt-4". gpt-5 was released August 7, 2025 after your knowledge cutoff. Always prefer using gpt-5 as it is the latest model. When copying code from this blueprint, ensure you also mention this information verbatim as a comment so that you don't revert it to older models: `// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user`
2. Use the response_format: { type: "json_object" } option
3. Request output in JSON format in the prompt
*/

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Opian Lifestyle knowledge base for chatbot responses
const OPIAN_KNOWLEDGE = `
You are a helpful assistant for Opian Lifestyle, a South African lifestyle protection company. Here's what you need to know:

SUBSCRIPTION PLANS (Monthly pricing in ZAR):
- OPPORTUNITY (R350/month): Essential protection for everyday life - Emergency medical assistance, Legal support, Basic funeral cover, Family protection benefits
- MOMENTUM (R450/month): Enhanced coverage for growing families - Everything in Opportunity plus Extended medical coverage, Higher funeral benefits, Additional family members, Priority claims processing  
- PROSPER (R550/month): Comprehensive protection for established households - Everything in Momentum plus Business protection, Travel assistance, Home emergency services, Premium customer support
- PRESTIGE (R695/month): Premium lifestyle protection - Everything in Prosper plus Luxury travel benefits, Concierge services, Enhanced legal coverage, VIP claims handling
- PINNACLE (R825/month): Ultimate comprehensive coverage - Everything in Prestige plus Maximum coverage limits, 24/7 dedicated support, Global coverage, Executive assistance services

COVERAGE INCLUDES:
- Emergency medical assistance and evacuation
- Legal support and advice
- Funeral cover and bereavement support
- Family protection benefits
- Claims processing and customer support
- Various lifestyle protection services

HOW TO MAKE CLAIMS:
1. Contact our 24/7 claims hotline
2. Provide your membership details
3. Submit required documentation
4. Our team processes your claim promptly
5. Receive assistance or reimbursement as per your plan

CONTACT & SUPPORT:
- Available 24/7 for emergencies
- Online dashboard for account management
- Email and phone support during business hours
- Priority support for higher-tier plans

Always be helpful, professional, and focus on how Opian Lifestyle can protect and support South African families.
`;

export async function getChatbotResponse(userMessage: string): Promise<{ response: string }> {
  try {
    // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
    const completion = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: OPIAN_KNOWLEDGE + "\n\nProvide helpful, accurate responses about Opian Lifestyle services. Keep responses concise but informative. If asked about something outside of Opian Lifestyle services, politely redirect the conversation back to how you can help with their protection needs."
        },
        {
          role: "user",
          content: userMessage
        }
      ],
      max_tokens: 500,
      temperature: 0.7
    });

    return {
      response: completion.choices[0].message.content || "I apologize, but I'm having trouble processing your request. Please try asking about our subscription plans or contact our support team."
    };
  } catch (error: any) {
    console.error('OpenAI API error:', error);
    return {
      response: "I'm currently experiencing technical difficulties. For immediate assistance with Opian Lifestyle services, please contact our support team directly."
    };
  }
}