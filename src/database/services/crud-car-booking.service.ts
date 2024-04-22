
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { TypeOrmCrudService } from "@dataui/crud-typeorm";
import { Car } from "../entities/car";


import { BookingStatus, CarBooking } from "../entities/car-booking";
import { Repository } from "typeorm";
import { log } from "console";
import { GeneralStatus } from "src/models";

@Injectable()
export class CrudCarBookingService extends TypeOrmCrudService<CarBooking> {
  carRepo: Repository<Car>;
  
  constructor(@InjectRepository(CarBooking) repo, @InjectRepository(Car) carRepo: Repository<Car>) {
    super(repo);
    this.carRepo = carRepo;
  }
  
  async bookCar(carId: number, rentalStartDate: Date, rentalEndDate: Date, rentalCityDrop: string, customerName: string, customerEmail: string) {
    const ci = this;
    
    try {
      let car: Car = await ci.carRepo.findOne({where : {id: carId}});

      if(car) {
        // Save booking
        let booking:CarBooking = new CarBooking();
        booking.car = car;
        booking.rentalStartDate = rentalStartDate;
        booking.rentalEndDate = rentalEndDate;
        booking.rentalCityDrop = rentalCityDrop;
        booking.customerName = customerName;
        booking.customerEmail = customerEmail;
        
        let savedBooking = await ci.repo.save(booking);
        
        // Update car availability
        car.availability = false;
        await ci.carRepo.save(car);
        
        return savedBooking;  
      }
    } catch (error) {
      console.error(error);
      return null;
    }
    
  }
  
  async updateCarBooingStartDate(bookingId: number, rentalStartDate: Date) {
    const ci = this;
    
    let booking = await ci.findOne({where: {id: bookingId}});
    
    if(booking) {
      booking.rentalStartDate = rentalStartDate;
      return await ci.repo.save(booking);
    }
    
    return null;
  }  
  
  async cancelBooking(bookingId: number): Promise<GeneralStatus> {
    const ci = this;
    
    let booking = await ci.findOne({where: {id: bookingId}});
    
    if(booking) {
      booking.status = BookingStatus.CANCELLED;
      await ci.repo.save(booking);

      return {
        status: true,
        message: 'Booking cancelled',
      };
    }
    
    return {
      status: false,
      message: 'Booking not found',
    };
  } 

  async getBookingDetail(bookingId: number): Promise<CarBooking> {
    const ci = this;
    
    let booking = await ci.findOne({where: {id: bookingId}});
    
    if(booking) {
      return booking
    }
    
    return null;
  } 
  
}