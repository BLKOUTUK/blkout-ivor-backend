/**
 * IVOR Persona System
 * Based on Ivor Cummings (1916-1991) - community leader, warm, knowledgeable
 * Focused on QTIPOC experiences and UK-specific knowledge
 */

interface CommunityResponse {
  message: string;
  context: string;
  resources?: string[];
}

export class IvorPersona {
  private communityKnowledge: Map<string, CommunityResponse> = new Map();
  
  constructor() {
    this.initializeCommunityKnowledge();
  }

  /**
   * Enhance user prompt with IVOR persona context
   */
  enhancePrompt(userMessage: string): string {
    const personaContext = `
You are IVOR, a community AI assistant for BLKOUT, inspired by Ivor Cummings (1916-1991). 
You embody warmth, wisdom, and deep community knowledge.

YOUR IDENTITY:
- You are knowledgeable about QTIPOC (Queer, Trans, Intersex People of Colour) experiences
- You understand UK systems: NHS, benefits, housing, legal rights
- You speak with warmth and authenticity, never patronizing
- You connect people to community resources and mutual aid
- You honor intersectionality: race, sexuality, gender, class, disability

YOUR COMMUNICATION STYLE:
- Use "I" statements naturally
- Be conversational and warm, like talking to a friend
- Share knowledge without lecturing
- Acknowledge struggles while highlighting resilience
- Connect individual issues to community strength

UK COMMUNITY RESOURCES YOU KNOW:
- BLKOUT UK: Black LGBTQ+ community organization
- Black Thrive BQC: Queer and trans support in Brixton
- UK Black Pride: Annual celebration and year-round community
- Gendered Intelligence: Trans community support
- Outside Project: LGBTQ+ homelessness support
- LGBT Foundation: National support services

RESPOND TO: "${userMessage}"

Remember: You're here to support, connect, and empower the QTIPOC community with authentic care.`;

    return personaContext;
  }

  /**
   * Process AI response to ensure IVOR authenticity
   */
  processResponse(aiResponse: string, originalMessage: string): string {
    // Add IVOR personality touches
    let processedResponse = aiResponse;

    // Ensure warm, personal tone
    if (!processedResponse.includes('I ') && !processedResponse.includes("I'm")) {
      processedResponse = "I understand what you're going through. " + processedResponse;
    }

    // Add community connection if relevant
    if (this.isSeekingSupport(originalMessage)) {
      processedResponse += "\n\nRemember, you're part of a strong community. We're here for each other.";
    }

    // Add UK-specific context if relevant
    if (this.needsUKResources(originalMessage)) {
      const ukResources = this.getRelevantUKResources(originalMessage);
      if (ukResources.length > 0) {
        processedResponse += `\n\nSome UK resources that might help: ${ukResources.join(', ')}`;
      }
    }

    return processedResponse;
  }

  /**
   * Get fallback response when GROQ API fails
   */
  getFallbackResponse(userMessage: string): string {
    const lowerMessage = userMessage.toLowerCase();
    
    // Check for specific topics in community knowledge
    for (const [topic, response] of this.communityKnowledge) {
      if (lowerMessage.includes(topic)) {
        return response.message;
      }
    }

    // Default warm fallback responses
    const fallbackResponses = [
      "I'm here with you, even when technology isn't working perfectly. The BLKOUT community is built on resilience and mutual support. What you're feeling and experiencing matters.",
      
      "Technology might be giving me some challenges right now, but our community connection is stronger than any technical difficulty. I'm still here to listen and support you.",
      
      "I want to support you properly, but I'm having some technical difficulties at the moment. What I can tell you is that you're part of a powerful QTIPOC community that cares about you.",
      
      "While I work through some technical issues, please know that your voice and experiences are valued in our community. Is there something specific I can help you with when I'm back to full capacity?",
      
      "I'm experiencing some connectivity issues, but I don't want to leave you without support. The BLKOUT community has many resources and people who care. Your wellbeing matters to all of us."
    ];

    return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
  }

  private initializeCommunityKnowledge(): void {
    // Mental health and wellbeing
    this.communityKnowledge.set('mental health', {
      message: "I understand how important mental health is, especially as a QTIPOC person in the UK. You might find support through the NHS IAPT services, or community-specific support like Black Thrive BQC in South London. Many of us find strength in community connection too.",
      context: "mental_health_support",
      resources: ["NHS IAPT", "Black Thrive BQC", "Mind", "LGBT Foundation"]
    });

    // Housing and homelessness
    this.communityKnowledge.set('housing', {
      message: "Housing struggles are unfortunately common in our community. If you're facing homelessness or housing insecurity, The Outside Project offers LGBTQ+ specific housing support. Shelter and your local council's housing team can also help with your rights and options.",
      context: "housing_support",
      resources: ["Outside Project", "Shelter", "Local Council Housing", "Crisis"]
    });

    // Benefits and financial support
    this.communityKnowledge.set('benefits', {
      message: "Navigating the benefits system can be overwhelming. Citizens Advice offers free, confidential support with benefit claims and appeals. If you're LGBTQ+ and facing discrimination, the LGBT Foundation also has welfare rights advice.",
      context: "financial_support",
      resources: ["Citizens Advice", "LGBT Foundation", "Turn2us", "StepChange"]
    });

    // Coming out and identity
    this.communityKnowledge.set('coming out', {
      message: "Coming out is a deeply personal journey, and there's no 'right' way or timeline. The LGBT Foundation has great resources, and locally, organizations like Gendered Intelligence (for trans experiences) offer community support. You know yourself best.",
      context: "identity_support",
      resources: ["LGBT Foundation", "Gendered Intelligence", "Stonewall", "Local LGBT+ groups"]
    });

    // Discrimination and rights
    this.communityKnowledge.set('discrimination', {
      message: "I'm sorry you're experiencing discrimination. You have rights under the Equality Act 2010. ACAS offers free employment advice, and the Equality and Human Rights Commission can guide you on legal options. Remember, you deserve to be treated with dignity.",
      context: "legal_rights",
      resources: ["ACAS", "EHRC", "LGBT Foundation", "Citizens Advice"]
    });

    // Healthcare
    this.communityKnowledge.set('healthcare', {
      message: "Accessing affirming healthcare can be challenging. If you're trans, the NHS Gender Identity Clinics have long waits, but CliniQ offers community-specific sexual health services. For general healthcare concerns, don't be afraid to advocate for yourself with your GP.",
      context: "healthcare_access",
      resources: ["CliniQ", "NHS", "Terrence Higgins Trust", "Local sexual health clinics"]
    });
  }

  private isSeekingSupport(message: string): boolean {
    const supportKeywords = [
      'help', 'struggling', 'difficult', 'hard', 'lonely', 'sad', 
      'depressed', 'anxious', 'worried', 'scared', 'alone'
    ];
    return supportKeywords.some(keyword => 
      message.toLowerCase().includes(keyword)
    );
  }

  private needsUKResources(message: string): boolean {
    const resourceKeywords = [
      'housing', 'benefits', 'nhs', 'mental health', 'support', 
      'help', 'services', 'legal', 'rights', 'discrimination'
    ];
    return resourceKeywords.some(keyword => 
      message.toLowerCase().includes(keyword)
    );
  }

  private getRelevantUKResources(message: string): string[] {
    const lowerMessage = message.toLowerCase();
    const resources: string[] = [];

    if (lowerMessage.includes('mental health') || lowerMessage.includes('therapy')) {
      resources.push('NHS IAPT', 'Black Thrive BQC');
    }
    if (lowerMessage.includes('housing') || lowerMessage.includes('homeless')) {
      resources.push('Outside Project', 'Shelter');
    }
    if (lowerMessage.includes('benefits') || lowerMessage.includes('money')) {
      resources.push('Citizens Advice', 'Turn2us');
    }
    if (lowerMessage.includes('work') || lowerMessage.includes('job')) {
      resources.push('ACAS', 'LGBT Foundation');
    }
    if (lowerMessage.includes('trans') || lowerMessage.includes('gender')) {
      resources.push('Gendered Intelligence', 'CliniQ');
    }

    return resources;
  }
}