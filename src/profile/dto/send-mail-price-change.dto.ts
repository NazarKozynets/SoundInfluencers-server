import {Prop} from "@nestjs/mongoose";

export class SendMailPriceChangeDto {
    @Prop()
    influencerId: string;
    
    @Prop()
    typeOfSocialMedia: string;
    
    @Prop()
    accountId: string;
}