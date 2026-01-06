import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HistoryService } from '../history.service';
import { History } from '../history.entity';
import { NotFoundException } from '@nestjs/common';

describe('HistoryService', () => {
  let service: HistoryService;
  let historyRepository: Repository<History>;

  const mockHistoryRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HistoryService,
        {
          provide: getRepositoryToken(History),
          useValue: mockHistoryRepository,
        },
      ],
    }).compile();

    service = module.get<HistoryService>(HistoryService);
    historyRepository = module.get<Repository<History>>(
      getRepositoryToken(History),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create and save a new history record', async () => {
      const bpm = 140;
      const exerciseId = 'exercise-uuid';
      const savedHistory = {
        id: 'history-uuid',
        bpm,
        exerciseId,
        date: new Date(),
      };

      mockHistoryRepository.create.mockReturnValue(savedHistory);
      mockHistoryRepository.save.mockResolvedValue(savedHistory);

      const result = await service.create(bpm, exerciseId);

      expect(mockHistoryRepository.create).toHaveBeenCalledWith({
        bpm,
        exerciseId,
      });
      expect(mockHistoryRepository.save).toHaveBeenCalledWith(savedHistory);
      expect(result).toEqual(savedHistory);
    });
  });

  describe('findAll', () => {
    it('should return all history records with relations', async () => {
      const historyRecords = [
        { id: '1', bpm: 120, exerciseId: 'exercise-1', date: new Date() },
        { id: '2', bpm: 140, exerciseId: 'exercise-2', date: new Date() },
      ];

      mockHistoryRepository.find.mockResolvedValue(historyRecords);

      const result = await service.findAll();

      expect(mockHistoryRepository.find).toHaveBeenCalledWith({
        relations: ['exercise'],
      });
      expect(result).toEqual(historyRecords);
    });
  });

  describe('findAllByExercise', () => {
    it('should return history records for a specific exercise ordered by date', async () => {
      const exerciseId = 'exercise-uuid';
      const historyRecords = [
        { id: '1', bpm: 120, exerciseId, date: new Date('2025-01-01') },
        { id: '2', bpm: 140, exerciseId, date: new Date('2025-01-02') },
      ];

      mockHistoryRepository.find.mockResolvedValue(historyRecords);

      const result = await service.findAllByExercise(exerciseId);

      expect(mockHistoryRepository.find).toHaveBeenCalledWith({
        where: { exerciseId },
        relations: ['exercise'],
        order: { date: 'DESC' },
      });
      expect(result).toEqual(historyRecords);
    });
  });

  describe('findOne', () => {
    it('should return a history record by id with relations', async () => {
      const historyRecord = {
        id: '1',
        bpm: 120,
        exerciseId: 'exercise-uuid',
        date: new Date(),
        exercise: { id: 'exercise-uuid', name: 'Test Exercise' },
      };

      mockHistoryRepository.findOne.mockResolvedValue(historyRecord);

      const result = await service.findOne('1');

      expect(mockHistoryRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
        relations: ['exercise'],
      });
      expect(result).toEqual(historyRecord);
    });

    it('should throw NotFoundException if history record not found', async () => {
      mockHistoryRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove a history record', async () => {
      const historyRecord = {
        id: '1',
        bpm: 120,
        exerciseId: 'exercise-uuid',
        date: new Date(),
      };

      mockHistoryRepository.findOne.mockResolvedValue(historyRecord);
      mockHistoryRepository.remove.mockResolvedValue(historyRecord);

      await service.remove('1');

      expect(mockHistoryRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
        relations: ['exercise'],
      });
      expect(mockHistoryRepository.remove).toHaveBeenCalledWith(historyRecord);
    });
  });
});
