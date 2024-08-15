import { Test, TestingModule } from '@nestjs/testing';
import { ErrorLogController } from './error-log.controller';

describe('ErrorLogController', () => {
  let controller: ErrorLogController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ErrorLogController],
    }).compile();

    controller = module.get<ErrorLogController>(ErrorLogController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
