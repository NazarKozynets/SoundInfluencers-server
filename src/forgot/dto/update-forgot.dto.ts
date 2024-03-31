import { PartialType } from '@nestjs/mapped-types';
import { CreateForgotDto } from './create-forgot.dto';

export class UpdateForgotDto extends PartialType(CreateForgotDto) {}
