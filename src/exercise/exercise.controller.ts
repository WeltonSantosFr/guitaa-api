import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ValidationPipe,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ExerciseService } from './exercise.service';
import { CreateExerciseDto } from './create-exercise.dto';
import { UpdateExerciseDto } from './update-exercise.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ExerciseOwnerGuard } from './exercise-owner.guard';

@Controller('exercises')
export class ExerciseController {
  constructor(private readonly exerciseService: ExerciseService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Body(ValidationPipe) createExerciseDto: CreateExerciseDto,
    @Req() req,
  ) {
    return this.exerciseService.create(createExerciseDto, req.user.id);
  }

  @Get()
  findAll(@Query('userId') userId?: string) {
    if (userId) {
      return this.exerciseService.findAllByUser(userId);
    }
    return this.exerciseService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.exerciseService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, ExerciseOwnerGuard)
  update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateExerciseDto: UpdateExerciseDto,
  ) {
    return this.exerciseService.update(id, updateExerciseDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, ExerciseOwnerGuard)
  remove(@Param('id') id: string) {
    return this.exerciseService.remove(id);
  }
}
