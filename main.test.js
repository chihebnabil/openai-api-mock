const { mockOpenAIResponse, stopMocking} = require('./main');
    
const OpenAI = require('openai');
const openai = new OpenAI();
    
describe('mockOpenAIResponse', () => {
    beforeEach(() => {
        mockOpenAIResponse(true);
    });
    afterEach(() => {
        stopMocking();
    });
    it('should mock the chat completion', async () => {
        try {
            // Post using fetch
            const response = await openai.chat.completions.create({
                    model: "gpt-3.5",
                    messages: [
                        { role: 'system', content: "You'r an expert chef" },
                        { role: 'user', content: "Suggest at least 5 recipes" },
                    ]
            });
           
            expect(response.choices[0]).toHaveProperty('finish_reason', 'stop');
            expect(response.model).toEqual('gpt-3.5-mock');
        } catch (error) {
            throw new Error(error);
        }
    });


    it('should mock image generation', async () => {
        try {
            const response = await openai.images.generate({
                    model: "dall-e-3",
                    prompt: "Kurt Cobain",
                    n: 1,
                    size: "1024x1024",
                    quality: "hd",
            });
     
            expect(response.data[0]).toHaveProperty('revised_prompt');
            expect(response.data[0]).toHaveProperty('url');
        }catch(error){
            throw new Error(error);
        }
    
    });

    it('should allow other requests', async () => {
        try {
            const response = await fetch('https://jsonplaceholder.typicode.com/todos');
            if (!response.ok) {
                console.log('Response not OK:', response);
                return;
            }
            const data = await response.json();
            expect(data[0]).toHaveProperty('completed');
        }catch(error){
            throw new Error(error);
        }
    })
});