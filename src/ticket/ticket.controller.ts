import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { TicketService } from './ticket.service';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuards } from 'src/guards/auth.guards';
import { CreateTicketDto } from './dto/create.ticket.dto';

@ApiBearerAuth()
@UseGuards(AuthGuards)
@Controller('ticket')
export class TicketController {

    constructor(private readonly ticketService: TicketService) { }


    @Post('create')
    handleTicket(@Body() createTicketDto: CreateTicketDto) {

        return this.ticketService.createNumberOfTicket(createTicketDto)



    }
    

}
