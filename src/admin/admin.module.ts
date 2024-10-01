import { Module } from '@nestjs/common';
import {AdminService} from "./admin.service";
import {MongooseModule} from "@nestjs/mongoose";
import {Promos, PromosSchema} from "../promos/schemas/promo.schema";
import {Client, ClientSchema} from "../auth/schemas/client.schema";
import {Influencer, InfluencerSchema} from "../auth/schemas/influencer.schema";
import {Offers, OffersSchema} from "../promos/schemas/offers.schema";
import {AdminController} from "./admin.controller";

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Promos.name, schema: PromosSchema },
            { name: Client.name, schema: ClientSchema },
            { name: Influencer.name, schema: InfluencerSchema },
            { name: Offers.name, schema: OffersSchema },
        ]),
    ],
    controllers: [AdminController],
    providers: [AdminService],
})
export class AdminModule {}