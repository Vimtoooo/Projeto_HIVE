import { Controller, Get, Param, Query } from '@nestjs/common';
import { ProfessionalIdDto, ProfessionalsQueryDto } from './professionals.dto';
import { ProfessionalsService } from './professionals.service';
@Controller('profissionais')
export class ProfessionalsController {
  constructor(private readonly professionals: ProfessionalsService) {}
  @Get() list(@Query() query: ProfessionalsQueryDto) {
    return this.professionals.list(query);
  }
  @Get(':id') detail(@Param() params: ProfessionalIdDto) {
    return this.professionals.detail(params.id);
  }
}
