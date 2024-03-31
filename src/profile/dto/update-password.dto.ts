import { ApiProperty } from '@nestjs/swagger';

export class UpdatePasswordClientDto {
  @ApiProperty({ required: true, default: 'client' })
  role: string;
  
  @ApiProperty({ required: true })
  id: string;

  @ApiProperty({ required: true })
  currentPassword: string;

  @ApiProperty({ required: true })
  newPassword: string;
}
