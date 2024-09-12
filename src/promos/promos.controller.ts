import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Put,
  Param,
  Delete,
  Query,
  UseInterceptors,
  UploadedFile,
  Res,
} from '@nestjs/common';
import { PromosService } from './promos.service';
import { CreatePromosDto } from './dto/create-promo.dto';
import { CreatePromosEstimateDto } from "./dto/create-promo-estimate.dto";
import { ApiQuery } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import File from 'multer'; // Correct import of File type

@Controller('promos')
export class PromosController {
  constructor(private readonly promosService: PromosService) {}

  @Post()
  createPromos(@Body() data: CreatePromosDto) {
    return this.promosService.createPromos(data);
  }

  @ApiQuery({ name: 'isPO', required: false, type: Boolean }) 
  @Post('estimate')
  createPromosForEstimate(
      @Body() data: CreatePromosEstimateDto,
      @Query('isPO') isPO?: boolean 
  ) {
    return this.promosService.createPromosForEstimate(data, isPO);
  }


  @ApiQuery({ name: 'promoId', required: true })
  @ApiQuery({ name: 'isPoNeed', required: true})
  @Put('update-estimate')
  async updateEstimatePromo(
      @Query('promoId') promoId: string,
      @Query('isPoNeed') isPoNeed: string
  ) {
    return this.promosService.updateEstimatePromo(promoId, isPoNeed);
  }

  @ApiQuery({ name: 'promoId', required: true })
  @ApiQuery({ name: 'status', required: true })
  @Get('verify-promo')
  verifyPromo(@Query() args: { promoId: string; status: string }) {
    return this.promosService.verifyPromo(args.promoId, args.status);
  }

  @Get('offers')
  getOffers() {
    return this.promosService.getOffers();
  }

  @Post('uploadScreenshot')
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(@UploadedFile() file: File) {
    return this.promosService.uploadDropBox(file);
  }
  

  @ApiQuery({ name: 'id', required: true })
  @Get('history')
  historyPromos(@Query() args: { id: string }) {
    return this.promosService.historyPromosClient(args.id);
  }

  @ApiQuery({ name: 'id', required: true })
  @Get('ongoing-promos-client')
  getOngoingPromosClient(@Query() args: { id: string }) {
    return this.promosService.getOngoingPromosClient(args.id);
  }

  @ApiQuery({ name: 'id', required: true })
  @Get('history-influencer')
  historyPromosInfluencer(@Query() args: { id: string }) {
    return this.promosService.historyPromosInfluencer(args.id);
  }

  @ApiQuery({ name: 'userId', required: true })
  @ApiQuery({ name: 'promosId', required: true })
  @Get('history/one')
  historyPromosOne(@Query() args: { userId: string; promosId: string }) {
    return this.promosService.historyPromosOne(args.userId, args.promosId);
  }

  @ApiQuery({ name: 'id', required: true })
  @ApiQuery({ name: 'userId', required: true })
  @Get('ongoing/one')
  getOngoingPromosClientCurrent(@Query() args: { id: string; userId: string }) {
    return this.promosService.getOngoingPromosClientCurrent(
      args.id,
      args.userId,
    );
  }

  @ApiQuery({ name: 'influencerId', required: true })
  @Get('get-new-promos')
  getNewPromos(@Query() args: { influencerId: string }) {
    return this.promosService.getNewPromos(args.influencerId);
  }

  @ApiQuery({ name: 'influencerId', required: true })
  @ApiQuery({ name: 'instagramUsername', required: true })
  @ApiQuery({ name: 'promoId', required: true })
  @ApiQuery({ name: 'promoResponse', required: true })
  @Put('update-response')
  updateResponseNewPromo(
    @Query()
    args: {
      influencerId: string;
      instagramUsername: string;
      promoId: string;
      promoResponse: string;
    },
  ) {
    return this.promosService.updateResponseNewPromo(
      args.influencerId,
      args.instagramUsername,
      args.promoId,
      args.promoResponse,
    );
  }

  @ApiQuery({ name: 'influencerId', required: true })
  @Get('get-ongoing-promos')
  getOngoingPromos(@Query() args: { influencerId: string }) {
    return this.promosService.getOngoingPromos(args.influencerId);
  }

  @ApiQuery({ name: 'influencerId', required: true })
  @ApiQuery({ name: 'promoId', required: true })
  @ApiQuery({ name: 'instagramUsername', required: true })
  @Get('get-ongoing-promo-one')
  getOngoingPromoOne(
    @Query()
    args: {
      influencerId: string;
      promoId: string;
      instagramUsername: string;
    },
  ) {
    return this.promosService.getOngoingPromoOne(
      args.influencerId,
      args.promoId,
      args.instagramUsername,
    );
  }

  @ApiQuery({ name: 'influencerId', required: true })
  @ApiQuery({ name: 'instagramUsername', required: true })
  @ApiQuery({ name: 'promoId', required: true })
  @Put('update-ongoing')
  updateOngoingPromo(
    @Query()
    args: {
      influencerId: string;
      instagramUsername: string;
      promoId: string;
    },
    @Body() body,
  ) {
    console.log(args);
    return this.promosService.updateOngoingPromo(
      args.influencerId,
      args.instagramUsername,
      args.promoId,
      body,
    );
  }
}
