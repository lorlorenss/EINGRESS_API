import { Test, TestingModule } from '@nestjs/testing';
import { LoginTotalController } from './login-total.controller';

describe('LoginTotalController', () => {
  let controller: LoginTotalController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LoginTotalController],
    }).compile();

    controller = module.get<LoginTotalController>(LoginTotalController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
