import OpenAI from 'openai';

export class AIEngine {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async chat(
    message: string,
    options: { context?: string; projectId?: string } = {}
  ): Promise<{ message: string; suggestions: string[]; tools: string[] }> {
    try {
      const systemPrompt = `You are Kiln, an AI assistant for building businesses and projects. 
        Help with:
        - Writing and debugging code
        - Building business logic
        - Creating APIs and databases
        - Designing user interfaces
        - Deploying applications
        - Troubleshooting errors`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message },
        ],
        temperature: 0.7,
        max_tokens: 1500,
      });

      const assistantMessage = response.choices[0].message.content || '';

      return {
        message: assistantMessage,
        suggestions: ['Generate code?', 'Need help?', 'Create template?'],
        tools: [],
      };
    } catch (error) {
      throw new Error(`AI Engine error: ${error}`);
    }
  }

  async generateCode(
    description: string,
    language: string
  ): Promise<string> {
    const prompt = `Generate ${language} code for: ${description}. Clean, well-commented, production-ready.`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 2000,
    });

    return response.choices[0].message.content || '';
  }

  async getSuggestions(
    fileContent: string,
    filePath: string,
    language: string
  ): Promise<string[]> {
    const prompt = `Review this ${language} code and suggest 3-5 improvements for performance, security, and quality:\n\n\`\`\`${language}\n${fileContent}\n\`\`\``;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
      max_tokens: 1000,
    });

    const content = response.choices[0].message.content || '';
    return content
      .split('\n')
      .filter((line) => line.trim())
      .slice(0, 5);
  }
}
