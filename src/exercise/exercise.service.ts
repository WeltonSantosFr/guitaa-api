import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Exercise } from './exercise.entity';
import { CreateExerciseDto } from './create-exercise.dto';
import { UpdateExerciseDto } from './update-exercise.dto';

@Injectable()
export class ExerciseService {
  constructor(
    @InjectRepository(Exercise)
    private readonly exerciseRepository: Repository<Exercise>,
  ) {}

  async create(
    createExerciseDto: CreateExerciseDto,
    userId: string,
  ): Promise<Exercise> {
    const exercise = this.exerciseRepository.create({
      ...createExerciseDto,
      userId,
    });
    return this.exerciseRepository.save(exercise);
  }

  async findAll(): Promise<Exercise[]> {
    return this.exerciseRepository.find({
      relations: ['history'],
    });
  }

  async findAllByUser(userId: string): Promise<Exercise[]> {
    return this.exerciseRepository.find({
      where: { userId },
      relations: ['history'],
    });
  }

  async findOne(id: string): Promise<Exercise> {
    const exercise = await this.exerciseRepository.findOne({
      where: { id },
      relations: ['history'],
    });
    if (!exercise) {
      throw new NotFoundException(`Exercise with ID ${id} not found`);
    }
    return exercise;
  }

  async update(
    id: string,
    updateExerciseDto: UpdateExerciseDto,
  ): Promise<Exercise> {
    const exercise = await this.findOne(id);

    if (updateExerciseDto.name !== undefined) {
      exercise.name = updateExerciseDto.name;
    }
    if (updateExerciseDto.durationMinutes !== undefined) {
      exercise.durationMinutes = updateExerciseDto.durationMinutes;
    }
    if (updateExerciseDto.currentBpmRecord !== undefined) {
      exercise.currentBpmRecord = updateExerciseDto.currentBpmRecord;
    }

    return this.exerciseRepository.save(exercise);
  }

  async remove(id: string): Promise<void> {
    const exercise = await this.findOne(id);
    await this.exerciseRepository.remove(exercise);
  }
}
