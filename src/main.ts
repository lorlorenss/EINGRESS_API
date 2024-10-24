import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as os from 'os';
import axios from 'axios'; // Corrected import

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

  // Fetch the public IP address
  let publicIpAddress: string | undefined;
  try {
    const response = await axios.get('http://169.254.169.254/latest/meta-data/public-ipv4');
    publicIpAddress = response.data;
  } catch (error) {
    console.error('Unable to retrieve public IP address', error);
  }

  // Log the IP addresses to the console
  console.log(`Private IP address: ${ipAddress || 'localhost'}`);
  console.log(`Public IP address: ${publicIpAddress || 'Not available'}`);

  // Listen on the dynamic IP address or fallback to localhost if none found
  await app.listen(3000, ipAddress || 'localhost');
}

bootstrap();
