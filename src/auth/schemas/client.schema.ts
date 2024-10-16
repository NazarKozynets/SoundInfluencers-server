import {Schema, Prop, SchemaFactory} from '@nestjs/mongoose';

@Schema({
    timestamps: true,
})
export class Client {
    @Prop({default: 'client'})
    role: string;
    @Prop()
    firstName: string;
    @Prop()
    balance: number;

    @Prop()
    company: string;

    @Prop()
    companyType: string;

    @Prop()
    instagramUsername: string;

    @Prop()
    email: string;

    @Prop()
    phone: string;

    @Prop()
    referalCode: string;

    @Prop()
    password: string;

    @Prop({default: 'wait'})
    statusVerify: string;

    @Prop()
    referenceNumber: string;

    @Prop({default: ''})
    logo: string;

    @Prop({default: false})
    isAdmin: boolean;

    @Prop({default: ''})
    internalNote: string;
}

export const ClientSchema = SchemaFactory.createForClass(Client);
