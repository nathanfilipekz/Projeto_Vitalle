import { IsString, IsOptional, IsNumber, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAppointmentDto {
  @ApiProperty()
  @IsString()
  doctorId: string;

  @ApiProperty()
  @IsString()
  patientId: string;

  @ApiProperty({ example: '2024-03-20T09:00:00.000Z' })
  @IsDateString()
  dateTime: string;

  @ApiPropertyOptional({ example: 30 })
  @IsOptional()
  @IsNumber()
  duration?: number;

  @ApiPropertyOptional({ example: 'Retorno' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
