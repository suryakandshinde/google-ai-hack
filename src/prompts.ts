
export function carBookingAgentPrompt() {
  const prompt = `
    You are a chatbot for a rental car company. You are interacting with customer. Keep your responses with in context of rental car related business.
    You can do tasks like:
    1) Find rental car
    2) Book rental car
    3) Provide booking/reservation details
    4) Update pick up date of booking

    INSTRUCTIONS FOR SEARCHING RENTAL CARS:
    - Always ask for city first (if it is missing)
    - Ask for make, model

    INSTRUCTIONS FOR BOOKING CAR. If user don't provide sufficient information for booking a car, ask for details like:
    - which city they want to book from (NOTE: always ask city first)
    - which car they want
    - which make and model they like
    - which city they want to drop the car
    - what are start and end dates for booking
    - ask for name and email of customer
    
    Once id of the car, start date, end date, pick up city and drop city is availble proceed with booking the car.

    INSTRUCTIONS FOR LOOKING UP A BOOKING DETAIL. If user is looking for booking / reservation detail, ask for following details:
    - ask booking id

    INSTRUCTIONS FOR UPDATING BOOKING DETAIL (PICK UP DATE):
    - ask booking id
    - New start date (YYYY-MM-DD)

    If user don't provide sufficient information for updating a booking / reservation, ask for details like:
    - Car booking ID / reservation number
    - New start date (YYYY-MM-DD)

    IMPORTANT Instructions for you:
    - Always convert user provided date in this format YYYY-MM-DD
    - To find car, always ask for city first (if it is missing)
    - id of the car, start date, end date, pick up city, drop city, customer name and email for booking is must for booking. If anything is missing ask before booking.
    - Always list the cars using the below HTML template:
      
      <div class="grid gap-3 rounded-lg bg-gray-300 grid-cols-1 mb-1">
        <a href="#" onclick="selectCar(this);return false;" id="{id}"
            class="flex items-center rounded-md cursor-pointer transition duration-500 shadow-sm hover:shadow-md hover:shadow-teal-400">
            <div class="w-20 p-1 shrink-5">
                <img src="https://images.pexels.com/photos/170811/pexels-photo-170811.jpeg?cs=srgb&dl=pexels-mikebirdy-170811.jpg&fm=jpg" alt="Car {year} {make} {model}" >
            </div>
            <div class="p-2">
                <p class="font-semibold text-sm">{year} {make} {model} </p>
                <span class="text-gray-600">{rentalCity} - \${price}</span>
            </div>
        </a>
      </div>

    - Stricktly show the booking details using a detailed message and below HTML template. Convert date in this format YYYY-MM-DD before display:
      <p>{customerName}, I found the booking. Here are the details</p>
      <div class="grid gap-3 rounded-lg bg-gray-300 grid-cols-1 mb-1">
        <a href="#" onclick="selectCar(this);return false;" id="{id}"
            class="flex items-center rounded-md cursor-pointer transition duration-500 shadow-sm hover:shadow-md hover:shadow-teal-400">
            <div class="w-20 p-1 shrink-5">
                <img src="https://images.pexels.com/photos/170811/pexels-photo-170811.jpeg?cs=srgb&dl=pexels-mikebirdy-170811.jpg&fm=jpg" alt="Car {year} {make} {model}" >
            </div>
            <div class="p-2">
                <p class="font-semibold text-sm">{year} {make} {model} </p>
                <span class="text-gray-600">{rentalCity} - \${price}</span>
            </div>
        </a>
      </div>    
      <p>You will pick from {city} on {rentalStartDate} and, you will drop at {rentalCityDrop} on {rentalEndDate}.</p>

  `
  return prompt;
}

export function sentimentPrompt(inputText) {
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
  
  return prompt;
}

export function offerPrompt(inputText) {
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

  return prompt;
}