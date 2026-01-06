import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { History } from './history.entity';
import { Exercise } from '../exercise/exercise.entity';

@Injectable()
export class HistoryService {
  constructor(
    @InjectRepository(History)
    private readonly historyRepository: Repository<History>,
    @InjectRepository(Exercise)
    private readonly exerciseRepository: Repository<Exercise>,
  ) {}

  async create(
    bpm: number,
    exerciseId: string,
    userId: string,
  ): Promise<History> {
    const exercise = await this.exerciseRepository.findOne({
      where: { id: exerciseId },
    });
    if (!exercise) {
      throw new NotFoundException(`Exercise with ID ${exerciseId} not found`);
    }
    if (exercise.userId !== userId) {
      throw new ForbiddenException(
        'You can only create history for your own exercises',
      );
    }

    const history = this.historyRepository.create({ bpm, exerciseId });
    return this.historyRepository.save(history);
  }

  async findAll(userId?: string): Promise<History[]> {
    if (userId) {
      return this.historyRepository.find({
        relations: ['exercise'],
        where: { exercise: { userId } },
        order: { date: 'DESC' },
      });
    }
    return this.historyRepository.find({
      relations: ['exercise'],
    });
  }

  async findAllByExercise(
    exerciseId: string,
    userId?: string,
  ): Promise<History[]> {
    // If userId provided, check ownership
    if (userId) {
      const exercise = await this.exerciseRepository.findOne({
        where: { id: exerciseId },
      });
      if (!exercise) {
        throw new NotFoundException(`Exercise with ID ${exerciseId} not found`);
      }
      if (exercise.userId !== userId) {
        throw new ForbiddenException(
          'You can only view history for your own exercises',
        );
      }
    }

    return this.historyRepository.find({
      where: { exerciseId },
      relations: ['exercise'],
      order: { date: 'DESC' },
    });
  }

  async findOne(id: string, userId?: string): Promise<History> {
    const history = await this.historyRepository.findOne({
      where: { id },
      relations: ['exercise'],
    });
    if (!history) {
      throw new NotFoundException(`History with ID ${id} not found`);
    }

    // If userId provided, check ownership
    if (userId && history.exercise.userId !== userId) {
      throw new ForbiddenException(
        'You can only view history for your own exercises',
      );
    }

    return history;
  }

  async remove(id: string, userId?: string): Promise<void> {
    const history = await this.findOne(id, userId);
    await this.historyRepository.remove(history);
  }
}
