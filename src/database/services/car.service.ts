import { Injectable } from "@nestjs/common";
import { FindOptionsWhere, ILike, QueryBuilder, Repository, SelectQueryBuilder } from "typeorm";
import { Car } from "../entities/car";
import { CrudCarService } from "./crud-car.service";
import { CrudCarBookingService } from "./crud-car-booking.service";
import { CarBooking } from "../entities/car-booking";
import { InjectRepository } from "@nestjs/typeorm";
import { MailService } from "src/mail/mail-service";
import { MailRequest } from "src/mail/models";
import { GeneralStatus } from "src/models";

@Injectable()
export class CarService {
    
    constructor(
         @InjectRepository(Car) private carRepositoryService: Repository<Car>,
        private readonly crudCarService: CrudCarService,
        private readonly crudCarBookingService: CrudCarBookingService,
        private readonly mailService: MailService,
    ) {}
    
    async findAll(model, availabilityStatus, city): Promise<Car[]> {
        const ci = this;
        const qb:QueryBuilder<Car> = ci.getCarQueryBuilder(model, availabilityStatus, city, 5);
        const cars = qb.execute();
        return cars;
        // return await this.crudCarService.find({where});
    }
    
    async carDetail(model, availabilityStatus, city): Promise<Car> {
        const ci = this;
        const qb = ci.getCarQueryBuilder(model, availabilityStatus, city, 1); 
        const car = await qb.getOne();
        return car;
        // return await this.crudCarService.findOne({where});
    }

    async count(model, availabilityStatus, city): Promise<Number> {
        const ci = this;
        const qb = ci.getCarQueryBuilder(model, availabilityStatus, city); 
        const countOfRecords = await qb.getCount();
        return countOfRecords;
        // return await this.crudCarService.count({where});
    }

    async getBookingDetail(bookingId): Promise<CarBooking> {
        const ci = this;
        return await ci.crudCarBookingService.getBookingDetail(bookingId);
    }  

    async bookCar(carId: number, rentalStartDate: Date, rentalEndDate: Date, rentalCityDrop: string, customerName: string, customerEmail: string): Promise<CarBooking> {
        let booking = await this.crudCarBookingService.bookCar(carId, rentalStartDate, rentalEndDate, rentalCityDrop, customerName, customerEmail);

        if(booking) { // Send confirmation email
            await this.sendBookingConfirmationMail(booking.id);
        }

        return booking;
    }    

    async sendBookingConfirmationMail(bookingId): Promise<GeneralStatus> {
        const ci = this;

        if(bookingId) {
            let booking = await ci.getBookingDetail(bookingId);
            if(booking) {
                let req: MailRequest = new MailRequest();
                req.email = booking.customerEmail;
                req.subject = `Your booking is confirmed | Booking Confirmation #: ${booking.id}`
                return this.mailService.sendMailUsingTemplate(req, './confirmation.hbs', { 
                    id: booking.id,
                    customerName: booking.customerName,
                    rentalCityDrop: booking.rentalCityDrop,
                    make: booking.car.make,
                    model: booking.car.model,
                    year: booking.car.year,
                    city: booking.car.city,
                    imageUrl: booking.car.imageUrl,
                    rentalPrice: booking.car.rentalPrice,
                });
            }
        }
    } 
    
    async cancelBooking(bookingId): Promise<GeneralStatus> {
        const ci = this;
        const status = await ci.crudCarBookingService.cancelBooking(bookingId);
        if(status.status) {
            if(bookingId) { // Send confirmation email
                await this.sendBookingCancellationMail(bookingId);
            }            
        }

        return status;
    }     
    
    async sendBookingCancellationMail(bookingId): Promise<any> {
        const ci = this;

        if(bookingId) {
            let booking = await ci.getBookingDetail(bookingId);
            if(booking) {
                let req: MailRequest = new MailRequest();
                req.email = booking.customerEmail;
                req.subject = `Your booking is cancelled | Booking Confirmation #: ${booking.id}`
                return this.mailService.sendMailUsingTemplate(req, './cancellation.hbs', { 
                    id: booking.id,
                    customerName: booking.customerName,
                    rentalCityDrop: booking.rentalCityDrop,
                    make: booking.car.make,
                    model: booking.car.model,
                    year: booking.car.year,
                    city: booking.car.city,
                    imageUrl: booking.car.imageUrl,
                    rentalPrice: booking.car.rentalPrice,
                });
            }
        }
    }

    async updateCarBooingStartDate(bookingId, rentalStartDate: Date): Promise<CarBooking> {
        return await this.crudCarBookingService.updateCarBooingStartDate(bookingId, rentalStartDate);
    } 

    private getCarQueryBuilder(model, availabilityStatus, city, limit?: number): SelectQueryBuilder<Car> {
        const qb = this.carRepositoryService.createQueryBuilder('car');
        let availability = availabilityStatus != null ? availabilityStatus : true;
        qb.where('car.availability = :availability', {availability});
       
        if(city) {
            qb.andWhere('car.city like :city', {city: city});
        }

        if(model) {
            qb.andWhere('(car.model like :model or car.make like :make)', {model: model, make: model});
        }

        if(limit) {
            qb.limit(limit);
        }
        
        return qb;
    }

}
