import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Offers } from '../../promos/schemas/offers.schema';  

@Schema({
    timestamps: true,
})
export class OffersTemp {  
    @Prop({required: true})
    id: number;
    
    @Prop({required: true})
    price: number;
    
    @Prop({required: true})
    followers: string;
    
    @Prop({required: true})
    network: string;
    
    @Prop({required: true})
    story: string;
    
    @Prop({required: true})
    maxInfluencer: number;
    
    @Prop({required: true})
    connectInfluencer: [];
    
    @Prop({required: true})
    musicStyles: any[];
    
    @Prop({required: true, default: false})
    isDeleted: boolean;  

    @Prop({required: true, default: true})
    isNew: boolean;
    
    @Prop({required: true, default: false})
    isUpdated: boolean;
}

export const OffersTempSchema = SchemaFactory.createForClass(OffersTemp);
