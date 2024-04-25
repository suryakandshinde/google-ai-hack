import { Injectable } from '@nestjs/common';
import { ChatCardOffer, Offer, SentimentOfferResponse, ChatResponse } from './models';

@Injectable()
export class AppService {


  async chat(inputText: string, history: Array<any>): Promise<ChatResponse> {
    const ci = this;

    const prompt = `
      You are a chatbot interacting with customer of a rental car company. Keep you responses with in context of rental car related business.

      ${inputText}
    `;

    const sentimentRequest = await ci.runGooglePrompt(prompt, history);
    let aiResponse: ChatResponse = new ChatResponse();
    aiResponse.text = sentimentRequest.text();

    return aiResponse;
  }

  async getSentiment(inputText: string): Promise<ChatResponse> {
    const ci = this;
    
    const prompt = `
      Read the feedback provided by a rental car customer. Decide if customer was satisfied or not based on the given feedback by the customer. Respond 1 if satisfied and 0 if unsatisfied.

      Customer Feedback: service was friendly and helpful.
      Response: 1
      
      Customer Feedback: I do not  understand why I have to pay additional fee if vehicle is returned without a full tank.
      Response: 0
      
      Customer Feedback: Customer service was good at MSP airport and the process was very fast.  From getting off of the plane to leaving with my rental car was less than 45 minutes.
      Response: 1
      
      Customer Feedback: The people where generally good, but overworked.  The printer went down.  The poor woman working the register was about to pull her hair out.  Customers were yelling at her, not me, but she was not in charge of the issues.
      Response: 0
      
      Customer Feedback: I did everything on-line - never talked to an agent during booking.  There were no problems, even though I had to switch car sizes after initial reservation. Agent on duty for pick-up was courteous.
      Response: 1
      
      Customer Feedback: We had a small problem with the size of car we reserved being available. The company was able to send another car over from a different location. We were delayed in getting on the road, but were satisfied with the car.
      Response: 1

      Customer Feedback: ${inputText}
      Response: 
    `;


    const sentimentRequest = await ci.runGooglePrompt(prompt);
    let aiResponse: ChatResponse = new ChatResponse();
    aiResponse.text = sentimentRequest.text();

    return aiResponse;
  }

  async getOffer(inputText: string): Promise<any> {
    const ci = this;
    
    const prompt = `
    Generate next best offer to unsatisfied customer. Choose offer recommendation from the following list: 'On-demand pickup location', 'Free Upgrade', 'Voucher', 'Premium features'.

    Customer Feedback: Slow, long lineup
    Offer: On-demand pickup location

    Customer Feedback: I do not  understand why I have to pay additional fee if vehicle is returned without a full tank.
    Offer: Premium features

    Customer Feedback: Based on the customer service personnel I encountered most recently, I would say it is vastly preferable for the personnel to be able to at least pretend to care whether the customer ever actually receives a car rental that was reserved months in advance.
    Offer: On-demand pickup location

    Customer Feedback: VERY slow service!
    Offer: Free Upgrade

    Customer Feedback: Please lower the prices.
    Offer: Free Upgrade

    Customer Feedback: Customer is important for the enjoyment of the car.  If it's a bad experience we won't return to that company if we can avoid it - they should remember abotut this
    Offer: Voucher

    Customer Feedback: the rep was friendly but it was so loud in there that I could not hear what she was saying. I HATE having to walk across a big lot with all of my bags in search of my car which is always in the furthest corner.
    Offer: On-demand pickup location

    Customer Feedback: It was absolutely ATROCIOUS! My wife and I were in a foreign country  when we realized that our car had an expired license plate and expired proof of insurance!
    Offer: Voucher

    Customer Feedback: The people where generally good, but overworked.  The printer went down.  The poor woman working the register was about to pull her hair out.  Customers were yelling at her, not me, but she was not in charge of the issues.
    Offer: On-demand pickup location

    Customer Feedback: They should upgrade me every time.
    Offer: Free Upgrade

    Customer Feedback: Most windows were closed.
    Offer: On-demand pickup location

    Customer Feedback: car cost more because I didn't pay when I reserved it
    Offer: Free Upgrade

    Customer Feedback: It took us almost three hours just to get a car! It was absurd.
    Offer: On-demand pickup location

    Customer Feedback: Provide more convenient car pickup from the airport parking.
    Offer: On-demand pickup location

    Customer Feedback: I haven't actually spoken with anyone from a car rental organization for quite a while.  When I did (probably about three years ago), I believe they were polite enough. However, I always hate to wait in lines when we have a lot of luggage.
    Offer: Free Upgrade

    Customer Feedback: They could really try work harder.
    Offer: Free Upgrade

    Customer Feedback: I had to wait in line for a long time to get and return the vehicle.  Also, the car was not clean.
    Offer: Voucher

    Customer Feedback: I would like the reps be knowledgeable about the immediate area around the rental agency and or have maps for the area available free of charge.
    Offer: Premium features

    ${inputText}
  `

    const chatPrompt = `Generate next best offer to unsatisfied customer. Choose offer recommendation from the following list: 'On-demand pickup location', 'Free Upgrade', 'Voucher', 'Premium features'.    Slow, long lineup    On-demand pickup location    I do not  understand why I have to pay additional fee if vehicle is returned without a full tank.    Premium features    Based on the customer service personnel I encountered most recently, I would say it is vastly preferable for the personnel to be able to at least pretend to care whether the customer ever actually receives a car rental that was reserved months in advance.    On-demand pickup location    VERY slow service!    Free Upgrade    Please lower the prices.    Free Upgrade    Customer is important for the enjoyment of the car.  If it's a bad experience we won't return to that company if we can avoid it - they should remember abotut this    Voucher    the rep was friendly but it was so loud in there that I could not hear what she was saying. I HATE having to walk across a big lot with all of my bags in search of my car which is always in the furthest corner.    On-demand pickup location    It was absolutely ATROCIOUS! My wife and I were in a foreign country  when we realized that our car had an expired license plate and expired proof of insurance!    Voucher    The people where generally good, but overworked.  The printer went down.  The poor woman working the register was about to pull her hair out.  Customers were yelling at her, not me, but she was not in charge of the issues.    On-demand pickup location    They should upgrade me every time.    Free Upgrade    Most windows were closed.    On-demand pickup location    car cost more because I didn't pay when I reserved it    Free Upgrade    It took us almost three hours just to get a car! It was absurd.    On-demand pickup location    Provide more convenient car pickup from the airport parking.    On-demand pickup location    I haven't actually spoken with anyone from a car rental organization for quite a while.  When I did (probably about three years ago), I believe they were polite enough. However, I always hate to wait in lines when we have a lot of luggage.    Free Upgrade    They could really try work harder.    Free Upgrade    I had to wait in line for a long time to get and return the vehicle.  Also, the car was not clean.    Voucher    ${inputText}`;

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
    const {
      GoogleGenerativeAI,
      HarmCategory,
      HarmBlockThreshold,
    } = require("@google/generative-ai");

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

    const safetySettings = [
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

    const chat = model.startChat({
      generationConfig,
      safetySettings,
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
 
}
