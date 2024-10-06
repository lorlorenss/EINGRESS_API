import { Body, Controller, Get, Param, Post, Delete, Put, NotFoundException, BadRequestException, UseInterceptors, UploadedFile, Res, Patch, UploadedFiles, InternalServerErrorException } from '@nestjs/common';
import { EmployeeService } from '../services/employee.service';
import { Employee } from '../models/employee.interface';
import { Observable, catchError, from, map, mergeMap, of, switchMap } from 'rxjs';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express'
import { diskStorage } from 'multer';
import { v4 as uuid4 } from 'uuid';
import * as path from 'path';
import { join } from 'path';
import { ParseIntPipe } from '@nestjs/common';

export const storage = {
  storage: diskStorage({
    destination: './uploads/profileimages',
    filename: (req, file, cb) => {
      const filename: string = path.parse(file.originalname).name.replace(/\s/g, '') + uuid4();
      const extension: string = path.parse(file.originalname).ext;

      cb(null, `${filename}${extension}`)
    }
  })
}

@Controller('employee')
export class EmployeeController {
  constructor(private userService: EmployeeService) { }



  @Post()
  @UseInterceptors(FileInterceptor('file', storage))
  create(@Body() payload: { employee: string }, @UploadedFile() file): Observable<Employee | Object> {
    // Parse the employee JSON string
    let updatedEmployeeData: Employee;

    try {
      updatedEmployeeData = JSON.parse(payload.employee);
    } catch (error) {
      console.error('Error parsing employee data:', error);
      throw new BadRequestException('Invalid employee data');
    }

    console.log('Parsed Employee Data:', updatedEmployeeData);

    // If no file is uploaded, use a default image path
    if (!file) {
      
      
      const updatedEmployeeData = JSON.parse(JSON.parse(JSON.stringify(payload.employee)));

      const nameOfFile = updatedEmployeeData.fullname;

      const specificFilePath = nameOfFile + '.png';
      console.log('typeof ', updatedEmployeeData);
      console.log('fullname is ' + nameOfFile);

      return this.userService.create({ ...updatedEmployeeData, profileImage: specificFilePath });
    }

    // If a file is uploaded, proceed with the file's filename
    return this.userService.create({ ...updatedEmployeeData, profileImage: file.filename });
  }

  @Get(':id') // Route for findOne
  findOne(@Param('id', ParseIntPipe) id: number): Observable<Employee> {
    return this.userService.findOne(id);
  }


  @Get() // Custom route name for findAll
  findAll(): Observable<Employee[]> {
    return this.userService.findAll();
  }

  @Delete(':id') //this code will delete the user and its logs
  deleteOne(@Param('id') id: string): Observable<any> {
    console.log("Deleting User id: ", id)
    return this.userService.deleteEmployeeWithAccessLogs(Number(id)).pipe(
      catchError(error => {
        throw new NotFoundException('User not found');
      }),
      map(() => ({ message: 'User and associated access logs deleted successfully' }))
    );
  }


  //THIS CODE IS FOR FETCHING THE RFIDTAG AND VERIFYING
  @Get('rfid/:rfidTag')
  verifyRfid(@Param('rfidTag') rfidTag: string): Observable<Employee> {
    console.log('RFID Tag input:', rfidTag); // Log the inputted RFID tag

    return this.userService.findByRfidTag(rfidTag).pipe(
      map(employee => {
        if (!employee) {
          throw new NotFoundException('Employee not found for RFID tag');
        }

        if (!employee.fingerprint1 && !employee.fingerprint2) {
          console.log("User branch:", employee.branch);
          throw new BadRequestException('Employee has no fingerprint');
        }
        return employee;
      }),
      catchError(err => {
        //console.error('Error verifying RFID:', err);
        throw err; // Re-throw the caught error to be handled by the caller
      })
    );
  }

  @Put(':id')
  @UseInterceptors(FileInterceptor('file', storage))
  updateOne(@Param('id') id: string, @Body() payload: { employee: Employee }, @UploadedFile() file): Observable<any> {
    console.log("Updating employee id: ", id)
    return this.userService.findOne(Number(id)).pipe(
      catchError(() => {
        throw new NotFoundException(`Employee with ID ${id} not found`);
      }),
      mergeMap(existingEmployee => {
        // If a file is provided, use the uploaded file's filename as the profile image
        // If no file is provided, retain the existing image filename from the database
        const profileImage = file ? file.filename : existingEmployee.profileImage;

        // Update the employee data
        const updatedEmployeeData = JSON.parse(JSON.parse(JSON.stringify(payload.employee)));

        const updatedEmployee: Employee = {
          ...updatedEmployeeData,
          profileImage: profileImage // Assign the file name as the profile image
        };

        // Update the employee using the service method
        return this.userService.updateOne(Number(id), updatedEmployee);
      })
    );
  }

  @Patch(':id/fingerprintFiles')
  @UseInterceptors(FilesInterceptor('file', 2))
  uploadFingerPrint(@Param('id') id: number, @UploadedFiles() file: Array<Express.Multer.File>): Observable<Employee>{
    const employee: Employee = {};

    if (file[0]){
      employee.fingerprintfile1 = file[0].buffer;
      employee.fingerprintfile1name = file[0].originalname;
    } 
    if (file[1]){
      employee.fingerprintfile2 = file[1].buffer;
      employee.fingerprintfile2name = file[1].originalname;
    } 

    return this.userService.uploadFingerPrint(employee, id).pipe(
      catchError(err => {
          throw new InternalServerErrorException('Could not upload fingerprint files');
      })
    );
  }

  @Post('log-access')
  logAccess(@Body() body: any): Promise<void> {
    const { fingerprint, rfid } = body;
    if (!fingerprint || !rfid) {
      throw new BadRequestException('Fingerprint and RFID are required');
    }

    console.log('Received log access request:', { fingerprint, rfid });

    return this.userService.logEmployeeAccess(fingerprint, rfid).toPromise();
  }


  @Post('upload')
  @UseInterceptors(FileInterceptor('file', storage))
  uploadFile(@UploadedFile() file): Observable<Object> {
    console.log(file);
    return of({ imagePath: file.filename });

  }

  @Get('profile-image/:imagename')
  findProfileImage(@Param('imagename') imagename, @Res() res): Observable<Object> {
    return of(res.sendFile(join(process.cwd(), 'uploads/profileimages/' + imagename)))
  }

  @Get('count')
  countEmployees(): Observable<number> {
    return this.userService.countEmployees();
  }


}
