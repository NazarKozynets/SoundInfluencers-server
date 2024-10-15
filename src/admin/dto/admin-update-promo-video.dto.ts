import {ApiProperty} from "@nestjs/swagger";

export class AdminUpdatePromoVideoDto {
    @ApiProperty({required: true})
    _id: string;

    @ApiProperty({required: true})
    videoId: string;
    
    @ApiProperty({required: false})
    oldVideoLink: string;
    
    @ApiProperty({required: false})
    newVideoLink: string;
    
    @ApiProperty({required: false})
    postDescription: string;
    
    @ApiProperty({required: false})
    storyTag: string;
    
    @ApiProperty({required: false, default: ''})
    swipeUpLink: string;
    
    @ApiProperty({required: false, default: ''})
    specialWishes: string;
}
