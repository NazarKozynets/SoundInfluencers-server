import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Client, ClientSchema } from './schemas/client.schema';
import { Influencer, InfluencerSchema } from './schemas/influencer.schema';
import {
  VerifyInfluencer,
  VerifyInfluencerSchema,
} from './schemas/verifyInfluencer.schema';
import {
  VerifyClient,
  VerifyClientSchema,
} from './schemas/verifyClient.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Client.name, schema: ClientSchema },
      { name: Influencer.name, schema: InfluencerSchema },
      { name: VerifyInfluencer.name, schema: VerifyInfluencerSchema },
      { name: VerifyClient.name, schema: VerifyClientSchema },
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
