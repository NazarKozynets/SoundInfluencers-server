import { Module } from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { InvoiceController } from './invoice.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  InvoiceDetails,
  InvoiceDetailsSchema,
} from './schemas/invoice-details.schema';
import { Invoices, InvoicesSchema } from './schemas/invoices.schema';
import {
  Influencer,
  InfluencerSchema,
} from 'src/auth/schemas/influencer.schema';
import { SaveInvoiceData, SaveInvoiceDataSchema } from './schemas/invoice-save.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: InvoiceDetails.name, schema: InvoiceDetailsSchema },
      { name: Invoices.name, schema: InvoicesSchema },
      { name: Influencer.name, schema: InfluencerSchema },
      { name: SaveInvoiceData.name, schema: SaveInvoiceDataSchema },
    ]),
  ],
  controllers: [InvoiceController],
  providers: [InvoiceService],
})
export class InvoiceModule {}
