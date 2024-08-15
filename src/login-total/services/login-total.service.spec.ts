import { Test, TestingModule } from '@nestjs/testing';
import { LoginTotalService } from './login-total.service';

describe('LoginTotalService', () => {
  let service: LoginTotalService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LoginTotalService],
    }).compile();

    service = module.get<LoginTotalService>(LoginTotalService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
