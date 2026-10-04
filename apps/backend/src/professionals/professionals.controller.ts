import { Controller, Get, Param, Query } from '@nestjs/common';
import { ProfessionalIdDto, ProfessionalsQueryDto } from './professionals.dto';
import { ProfessionalsService } from './professionals.service';
import { ReviewsQueryDto } from './reviews-query.dto';
@Controller('profissionais')
export class ProfessionalsController {
  constructor(private readonly professionals: ProfessionalsService) {}
  @Get() list(@Query() query: ProfessionalsQueryDto) {
    return this.professionals.list(query);
  }
  @Get(':id/avaliacoes') reviews(
    @Param() params: ProfessionalIdDto,
    @Query() q: ReviewsQueryDto,
  ) {
    return this.professionals.reviews(params.id, q);
  }
  @Get(':id') detail(@Param() params: ProfessionalIdDto) {
    return this.professionals.detail(params.id);
  }
}
