import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { NOTFOUND } from 'dns';
import mongoose, { Model } from 'mongoose';
import { Game, GameDocument } from 'src/schema/game.schema';
import { Ticket, TicketDocument } from 'src/schema/ticket.schema';
import axios from 'axios'
import { CreateTicketDto } from './dto/create.ticket.dto';

@Injectable()
export class TicketService {

    constructor(
        @InjectModel(Ticket.name) private readonly ticketModel: Model<TicketDocument>,
        @InjectModel(Game.name) private readonly gameModel: Model<GameDocument>,
    ) { }

    async createNumberOfTicket(createTicketDto: CreateTicketDto) {
        const game = await this.gameModel.findById(createTicketDto.gameId);
        const gameId = game?._id
        if (!game) throw new NotFoundException("This game is not present...");
        if (game.isTicketGenrated == true) throw new BadRequestException("Tocket already created")

        const numberOfTickets = game.numberOfPlayers;
        let titles: string[] = [];

        switch (createTicketDto.title) {
            case 'animals': {
                const response = await axios.get(`https://api.mockster.dev/api/v1/animals?Count=${numberOfTickets}`);
                titles = response.data.map((item: any) => Object.values(item)[0]);
                break;
            }
            case 'flowers': {
                const response = await axios.get('https://raw.githubusercontent.com/dariusk/corpora/master/data/plants/flowers.json');
                titles = response.data.flowers;
                break;
            }
            case 'cars': {
                const response = await axios.get(
                    'https://vpic.nhtsa.dot.gov/api/vehicles/GetMakesForVehicleType/car?format=json'
                );
                titles = response.data.Results.map((make) => make.MakeName);
                break;
            }

            default: {
                const response = await axios.get(`https://api.mockster.dev/api/v1/animals?Count=${numberOfTickets}`);
                titles = response.data.map((item: any) => Object.values(item)[0]);
                break;
            }
        }


        while (titles.length < numberOfTickets) {
            titles = titles.concat(titles);
        }
        titles = titles.slice(0, numberOfTickets);

        const ticketsToCreate = titles.map(title => ({ gameId, title }));

        await this.ticketModel.insertMany(ticketsToCreate);
        game.isTicketGenrated = true
        await game.save()

        return { message: `${ticketsToCreate.length} tickets created successfully.` };
    }
}
