import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as os from 'os';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();  // Enable CORS
  app.setGlobalPrefix('api');

  // Get the network interfaces
  const networkInterfaces = os.networkInterfaces();
  let ipAddress: string | undefined;

  // Loop through the network interfaces to find the appropriate IP address
  for (const netInterface of Object.values(networkInterfaces)) {
    for (const address of netInterface) {
      // Check for IPv4 and non-internal addresses
      if (address.family === 'IPv4' && !address.internal) {
        ipAddress = address.address; // Get the first found IP address
        break;
      }
    }
    if (ipAddress) break; // Exit loop if an IP address is found
  }

  const port = 3000; // Define your port here

  // Log the IP address and port to the console
  console.log(`Server is running on IP address: ${ipAddress || 'localhost'}, Port: ${port}`);

  // Listen on the dynamic IP address or fallback to localhost if none found
  await app.listen(port, ipAddress || 'localhost');
}

bootstrap();
