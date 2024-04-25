import { Injectable } from '@nestjs/common';
import { Offer, SentimentOfferResponse, ChatResponse } from './models';
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { Content, FunctionCallingMode, GenerateContentRequest, HarmBlockThreshold, HarmCategory, Tool } from '@google/generative-ai';

import { GoogleGenerativeAI, FunctionDeclarationSchemaType } from "@google/generative-ai";
import { CarService } from './database/services/car.service';
import { carBookingAgentPrompt, offerPrompt, sentimentPrompt } from './prompts';
import { FindOptionsWhere, ILike } from 'typeorm';
import { Car } from './database/entities/car';

@Injectable()
export class GoogleAIService {
  safetySettings = [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
  ];

  constructor(private carService: CarService) {

  }

  // Chat using GoogleAI nodejs
  async chatWithFunctionCalling(inputText: string, history: Array<any>): Promise<ChatResponse> {
    let ci = this;

    let response = await ci.runGooglePromptWithFunctions(inputText, history);
    let aiResponse: ChatResponse = new ChatResponse();
    aiResponse.text = response.candidates[0].content.parts[0].text;

    return aiResponse;    
  }

  //Chat using langchain
  async chat(inputText: string, history: Array<any>): Promise<ChatResponse> {
    const ci = this;

    const model = new ChatGoogleGenerativeAI({
      model: process.env.MODEL_ID,
      maxOutputTokens: 2048,
      safetySettings: ci.safetySettings
    });
    
    const input2 = [
      new SystemMessage({
        content: [
          {
            type: 'text',
            text: 'You are a chatbot interacting with customer of a rental car company. Keep you responses with in context of rental car related business.'
          }
        ]
      }),
      new HumanMessage({
        content: [
          {
            type: "text",
            text: inputText,
          },
        ],
      }),
    ];

    const res = await model.invoke(input2);

    let aiResponse: ChatResponse = new ChatResponse();
    aiResponse.text = res.content.toString();

    return aiResponse;
  }

  async getSentiment(inputText: string): Promise<ChatResponse> {
    const ci = this;
    
    const prompt = sentimentPrompt(inputText);
    const sentimentRequest = await ci.runGooglePrompt(prompt);

    let aiResponse: ChatResponse = new ChatResponse();
    aiResponse.text = sentimentRequest.text();
    return aiResponse;
  }

  async getOffer(inputText: string): Promise<any> {
    const ci = this;
    
    const prompt = offerPrompt(inputText);
    const sentimentRequest = await ci.runGooglePrompt(prompt);

    let aiResponse: ChatResponse = new ChatResponse();
    aiResponse.text = sentimentRequest.text().replace('Offer: ', '').trim();
    return aiResponse;
  }

  async getSentimentAndOffer(userInput) {
    const ci = this;

    // Get sentiment
    const sentimentResponse = await ci.getSentiment(userInput);

    // Get Offer
    const offerResponse = await ci.getOffer(userInput);

    // Combine sentiment and offer
    let aiResponse: SentimentOfferResponse = new SentimentOfferResponse();
    aiResponse.sentiment = sentimentResponse.text;
    aiResponse.offer = offerResponse.text;

    return aiResponse;
  }

  private async runGooglePrompt(prompt: string, history?: Array<any>) {
    let ci = this;

    const MODEL_NAME = process.env.MODEL_ID;
    const API_KEY = process.env.API_KEY;

    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const generationConfig = {
      temperature: 0.9,
      topK: 1,
      topP: 1,
      maxOutputTokens: 2048,
    };

    const chat = model.startChat({
      generationConfig,
      safetySettings: ci.safetySettings,
      history: history,
    });

    const result = await chat.sendMessage(prompt);
    const response = result.response;
    console.log(response.text());

    if (!response) {
      throw new Error("Error generating response");
    }

    return response;
  }

  private async runGooglePromptWithFunctions(inputText: string, history?: Array<any>) {
    let ci = this;

    const MODEL_NAME = process.env.MODEL_ID;
    const API_KEY = process.env.API_KEY;
  
    const generationConfig = {
      temperature: 0,
      topK: 1,
      topP: 1,
      maxOutputTokens: 2048,
    };

    const FUNCTIONS = ci.functionAndTools().functions;
    const tools = ci.functionAndTools().tools;

    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel(
      { 
        generationConfig,
        model: MODEL_NAME, 
        tools: tools, 
        toolConfig: {
          functionCallingConfig: {
            mode: FunctionCallingMode.AUTO,
            // allowedFunctionNames: ["convertCtoF"]
          },
        } 
      },
      { apiVersion: "v1beta" }
    );

    // For text-only inputs, use the gemini-pro model
    const prompt: Content = {
      role: "user", // <- Note the role here (the role is 'user' i.e. user provided message)
      parts: [
        {
          text: inputText,
        },
      ],
    };
  
    const chat = model.startChat({
      generationConfig,
      safetySettings: ci.safetySettings,
      history: history,
    });

    const result = await chat.sendMessage(prompt.parts);
    const response = result.response;
    // console.log(response.text());
    // console.dir(response, { depth: null });
  
    if (response.candidates.length === 0) {
      throw new Error("No candidates");
    }
  
    const content = result.response.candidates[0].content;
    if (content.parts.length === 0) {
      throw new Error("No parts");
    }

    const functionCall = content.parts[0].functionCall;
    const text = content.parts.map(({ text }) => text).join("");

    if (functionCall) {
      const { name, args } = functionCall;
      const fn = FUNCTIONS[name];

      if (!fn) {
        throw new Error(`Unknown function "${name}"`);
      }

      const functionRequest: Content = {
        role: "function", // <- Note the role here (the role is 'function' i.e. call a function)
        parts: [
          {
            functionResponse: {
              name,
              response: {
                name,
                content: await fn(args),
              },
            },
          },
        ],
      };

      prompt.parts[0].text = `
        ${carBookingAgentPrompt()}

        ${inputText}
      `;

      const request2: GenerateContentRequest = {
        contents: [prompt, content, functionRequest],
      };
      const response2 = await model.generateContent(request2);
      const result2 = response2.response;
      
      console.log(result2.text());
      return result2;
    } else if (text) {
      console.log(text);
      return response;
    }

  }

  async getOfferDetail(offerId: string) {
    const offers = [
      {
          "id": "offer1",
          "name": "On-demand pickup location",
          "description": "An offer created just for you to provide you more flexibility!",
          "asset": "offer_1.png",
          "metadata": ["location", "pickup", "drop off"]
      },
      {
          "id": "offer2",
          "name": "Free Upgrade",
          "description": "Get the comfort you wiht a free upgrade!",
          "asset": "offer_2.png",
          "metadata": ["comfort", "more space", "big car", "large trunk"]
      },        
      {
          "id": "offer3",
          "name": "Voucher",
          "description": "An offer that gives you more comfort at the same low cost!",
          "asset": "offer_3.png",
          "metadata":["upgrade", "free upgrade", "discounted upgrade"]
      },
      {
          "id": "offer4",
          "name": "Premium features",
          "description": "An offer that gives more premium features!",
          "asset": "offer_4.png",
          "metadata": ["premium", "luxury"]
      }                        
    ];
    
    const offer: Offer = offers.find((o) => {
      return o.name.toLowerCase().trim() == offerId.toLowerCase().trim()
    });

    if(offer) {
      offer.asset = `${process.env.SERVER_URL}/assets/${offer.asset}`;
    }

    return offer;
  }
   
  private functionAndTools(): FunctionTools {
    const ci = this;

    const FUNCTIONS = {
      listOfCars: async ({model, availability, city}) => {
        const cars = await ci.carService.findAll(model, availability, city);
        let response: string = '';

        // Note how we are building the car response in plain text format using cars[] JSON object. 
        // This helps LLM to understand the text better and provide good response.
        if(cars && cars.length > 0) {
          response = response.concat(`Found ${cars.length} cars. Here is the list. `);
            for (let index = 0; index < cars.length; index++) {
              const c = cars[index];
              response = response.concat(`${c.toString()} \n`)
            }
        }
        return cars; 
      },
      carDetail: async ({model, availability, city}) => {      
        return await ci.carService.carDetail(model, availability, city);
      }, 
      bookACar: async ({id, rentalStartDate, rentalEndDate, rentalCityDrop, customerName, customerEmail}) => {      
        return await ci.carService.bookCar(id, rentalStartDate, rentalEndDate, rentalCityDrop, customerName, customerEmail);
      },
      updateCarBooingStartDate: async ({bookingId, rentalStartDate}) => {      
        return await ci.carService.updateCarBooingStartDate(bookingId, rentalStartDate);
      },
      cancelBooking: async ({bookingId}) => {      
        return await ci.carService.cancelBooking(bookingId);
      },      
      getBookingDetail: async ({bookingId}) => {      
        return await ci.carService.getBookingDetail(bookingId);
      }, 
      sendBookingConfirmationMail: async ({bookingId}) => {      
        return await ci.carService.sendBookingConfirmationMail(bookingId);
      },      
      countCars: async ({model, availability, city}) => {     
        return await ci.carService.count(model, availability, city);
      },
      addNumbers: ({ value, value2 }) => { // This is just a sample. Remove after implementation
        const num1 = typeof value === "string" ? parseFloat(value) : value;
        const num2 = typeof value2 === "string" ? parseFloat(value2) : value2;
        if (!Number.isFinite(num1) || !Number.isFinite(num2)) {
          throw new Error("Value should finite number");
        }
        return num1 + num2;
      },
    };
    
    const tools: Array<Tool> = [
      {
        functionDeclarations: [
          {
            name: "addNumbers",
            description: "Add 2 numbers",
            parameters: {
              type: FunctionDeclarationSchemaType.OBJECT,
              properties: {
                value: { type: FunctionDeclarationSchemaType.NUMBER },
                value2: { type: FunctionDeclarationSchemaType.NUMBER },
              },
              required: ["value", "value2"],
            },
          },  
          {
            name: "listOfCars",
            description: "Get a list of cars from the database",
            parameters: {
              type: FunctionDeclarationSchemaType.OBJECT,
              properties: {
                model: { type: FunctionDeclarationSchemaType.STRING },
                availability: { type: FunctionDeclarationSchemaType.BOOLEAN },
                city: { type: FunctionDeclarationSchemaType.STRING },
              },
              required: ["model"],
            },            
          }, 
          {
            name: "countCars",
            description: "Count the number of cars in the database",
            parameters: {
              type: FunctionDeclarationSchemaType.OBJECT,
              properties: {
                model: { type: FunctionDeclarationSchemaType.STRING },
                availability: { type: FunctionDeclarationSchemaType.BOOLEAN },
                city: { type: FunctionDeclarationSchemaType.STRING },
              },
              required: ["model"],
            },            
          },            
          {
            name: "carDetail",
            description: "Get details of a car with the provided name or description of car",
            parameters: {
              type: FunctionDeclarationSchemaType.OBJECT,
              properties: {
                model: { type: FunctionDeclarationSchemaType.STRING },
                availability: { type: FunctionDeclarationSchemaType.BOOLEAN },
                city: { type: FunctionDeclarationSchemaType.STRING },
              },
              required: ["model"],
            },
          },
          {
            name: "bookACar",
            description: "Book a car or reservation.",
            parameters: {
              type: FunctionDeclarationSchemaType.OBJECT,
              properties: {
                id: { type: FunctionDeclarationSchemaType.NUMBER, description: 'ID of the car e.g. 1' },
                rentalStartDate: { type: FunctionDeclarationSchemaType.STRING },
                rentalEndDate: { type: FunctionDeclarationSchemaType.STRING },
                rentalCityDrop: { type: FunctionDeclarationSchemaType.STRING },
                customerName: { type: FunctionDeclarationSchemaType.STRING, description: 'Name of customer e.g. John Doe' },
                customerEmail: { type: FunctionDeclarationSchemaType.STRING, description: 'Email of customer e.g. johndoe@carrental.com' },
              },
              required: ["id", "rentalStartDate", "rentalEndDate", "rentalCityDrop", "customerName", "customerEmail"],
            },
          },
          {
            name: "updateCarBooingStartDate",
            description: "Update the start date a rental car booking/reservation. User will provide booking id / reservatin id and new start date.",
            parameters: {
              type: FunctionDeclarationSchemaType.OBJECT,
              properties: {
                bookingId: { type: FunctionDeclarationSchemaType.NUMBER },
                rentalStartDate: { 
                  type: FunctionDeclarationSchemaType.STRING, 
                  description: 'Booking start date in the format of YYY-MM-DD. e.g., 2022-04-25',
                },
              },
              required: ["model"],
            },
          },
          {
            name: "cancelBooking",
            description: "Cancel a rental car booking/reservation. User will provide booking id / reservatin id.",
            parameters: {
              type: FunctionDeclarationSchemaType.OBJECT,
              properties: {
                bookingId: { 
                  type: FunctionDeclarationSchemaType.NUMBER, 
                  description: 'Booking/Reservation ID of the car booking. e.g., 1',
                },
              },
              required: ["bookingId"],
            },
          },             
          {
            name: "getBookingDetail",
            description: "Booking details of rental car reservation. User will provide booking id / reservatin id.",
            parameters: {
              type: FunctionDeclarationSchemaType.OBJECT,
              properties: {
                bookingId: { 
                  type: FunctionDeclarationSchemaType.NUMBER, 
                  description: 'Booking ID of the car booking. e.g., 1',
                },
              },
              required: ["bookingId"],
            },
          }, 
          {
            name: "sendBookingConfirmationMail",
            description: "Send booking details of rental car reservation via email. User will provide booking id / reservatin id.",
            parameters: {
              type: FunctionDeclarationSchemaType.OBJECT,
              properties: {
                bookingId: { 
                  type: FunctionDeclarationSchemaType.NUMBER, 
                  description: 'Booking ID of the car booking. e.g., 1',
                },
              },
              required: ["bookingId"],
            },
          },                                       
        ]       
      },
    ];  
    
    return {functions: FUNCTIONS, tools: tools}
  }
}

export class FunctionTools {

  constructor(public functions, public tools) {}
}