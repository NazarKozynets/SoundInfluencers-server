import {ApiProperty} from "@nestjs/swagger";

export class AdminSendEmailToInfluencerDto {
    @ApiProperty({required: true})
    influencerId: string;

    @ApiProperty({required: true})
    instagramUsername: string;

    @ApiProperty({required: false})
    videoLink: string;

    @ApiProperty({required: false})
    postDescription: string;

    @ApiProperty({required: false})
    dateRequest: string;

    @ApiProperty({required: false})
    storyTag: string;

    @ApiProperty({required: false})
    storyLink: string;
}