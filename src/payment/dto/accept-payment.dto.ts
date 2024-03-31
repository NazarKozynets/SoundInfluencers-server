import { ApiProperty } from '@nestjs/swagger';

export class AcceptOrderStripe {
  @ApiProperty({ required: true })
  orderId: string;

  @ApiProperty({ required: true })
  statusOrder: string;
}
