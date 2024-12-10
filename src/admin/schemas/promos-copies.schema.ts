import {Prop, Schema, SchemaFactory} from '@nestjs/mongoose';
import {Promos} from "../../promos/schemas/promo.schema";

@Schema({
    timestamps: true,
})
export class PromosCopies extends Promos {
    @Prop()
    totalFollowers: number;
}

export const PromosCopiesSchema = SchemaFactory.createForClass(PromosCopies);
