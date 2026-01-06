import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExerciseService } from '../exercise.service';
import { Exercise } from '../exercise.entity';
import { CreateExerciseDto } from '../create-exercise.dto';
import { UpdateExerciseDto } from '../update-exercise.dto';
import { NotFoundException } from '@nestjs/common';

describe('ExerciseService', () => {
  let service: ExerciseService;
  let exerciseRepository: Repository<Exercise>;

  const mockExerciseRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExerciseService,
        {
          provide: getRepositoryToken(Exercise),
          useValue: mockExerciseRepository,
        },
      ],
    }).compile();

    service = module.get<ExerciseService>(ExerciseService);
    exerciseRepository = module.get<Repository<Exercise>>(
      getRepositoryToken(Exercise),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create and save a new exercise', async () => {
      const createExerciseDto: CreateExerciseDto = {
        name: 'Test Exercise',
        durationMinutes: 15,
        currentBpmRecord: 120,
      };
      const userId = 'user-uuid';

      const savedExercise = {
        id: 'exercise-uuid',
        ...createExerciseDto,
        userId,
      };

      mockExerciseRepository.create.mockReturnValue(savedExercise);
      mockExerciseRepository.save.mockResolvedValue(savedExercise);

      const result = await service.create(createExerciseDto, userId);

      expect(mockExerciseRepository.create).toHaveBeenCalledWith({
        ...createExerciseDto,
        userId,
      });
      expect(mockExerciseRepository.save).toHaveBeenCalledWith(savedExercise);
      expect(result).toEqual(savedExercise);
    });
  });

  describe('findAll', () => {
    it('should return all exercises with relations', async () => {
      const exercises = [
        { id: '1', name: 'Exercise 1', userId: 'user-1' },
        { id: '2', name: 'Exercise 2', userId: 'user-2' },
      ];

      mockExerciseRepository.find.mockResolvedValue(exercises);

      const result = await service.findAll();

      expect(mockExerciseRepository.find).toHaveBeenCalledWith({
        relations: ['history'],
      });
      expect(result).toEqual(exercises);
    });
  });

  describe('findAllByUser', () => {
    it('should return exercises for a specific user', async () => {
      const userId = 'user-uuid';
      const exercises = [
        { id: '1', name: 'Exercise 1', userId },
        { id: '2', name: 'Exercise 2', userId },
      ];

      mockExerciseRepository.find.mockResolvedValue(exercises);

      const result = await service.findAllByUser(userId);

      expect(mockExerciseRepository.find).toHaveBeenCalledWith({
        where: { userId },
        relations: ['history'],
      });
      expect(result).toEqual(exercises);
    });
  });

  describe('findOne', () => {
    it('should return an exercise by id with relations', async () => {
      const exercise = {
        id: '1',
        name: 'Test Exercise',
        userId: 'user-uuid',
        user: { id: 'user-uuid', username: 'testuser' },
        history: [],
      };

      mockExerciseRepository.findOne.mockResolvedValue(exercise);

      const result = await service.findOne('1');

      expect(mockExerciseRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
        relations: ['history'],
      });
      expect(result).toEqual(exercise);
    });

    it('should throw NotFoundException if exercise not found', async () => {
      mockExerciseRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update an exercise', async () => {
      const existingExercise = {
        id: '1',
        name: 'Old Exercise',
        userId: 'user-uuid',
        durationMinutes: 10,
      };
      const updateExerciseDto: UpdateExerciseDto = {
        name: 'Updated Exercise',
        durationMinutes: 20,
      };
      const updatedExercise = { ...existingExercise, ...updateExerciseDto };

      mockExerciseRepository.findOne.mockResolvedValue(existingExercise);
      mockExerciseRepository.save.mockResolvedValue(updatedExercise);

      const result = await service.update('1', updateExerciseDto);

      expect(mockExerciseRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
        relations: ['history'],
      });
      expect(mockExerciseRepository.save).toHaveBeenCalledWith(updatedExercise);
      expect(result).toEqual(updatedExercise);
    });
  });

  describe('remove', () => {
    it('should remove an exercise', async () => {
      const exercise = { id: '1', name: 'Test Exercise', userId: 'user-uuid' };

      mockExerciseRepository.findOne.mockResolvedValue(exercise);
      mockExerciseRepository.remove.mockResolvedValue(exercise);

      await service.remove('1');

      expect(mockExerciseRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
        relations: ['history'],
      });
      expect(mockExerciseRepository.remove).toHaveBeenCalledWith(exercise);
    });
  });
});
