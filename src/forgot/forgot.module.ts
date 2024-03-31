import { Module } from '@nestjs/common';
import { ForgotService } from './forgot.service';
import { ForgotController } from './forgot.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Client, ClientSchema } from 'src/auth/schemas/client.schema';
import {
  Influencer,
  InfluencerSchema,
} from 'src/auth/schemas/influencer.schema';
import { Forgot, ForgotSchema } from './schemas/forgot.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Client.name, schema: ClientSchema },
      { name: Influencer.name, schema: InfluencerSchema },
      { name: Forgot.name, schema: ForgotSchema },
    ]),
  ],
  controllers: [ForgotController],
  providers: [ForgotService],
})
export class ForgotModule {}
