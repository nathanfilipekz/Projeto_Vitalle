import { IsEmail, IsString, MinLength, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'Dr. João Silva' })
  @IsString()
  @MinLength(3)
  name: string;

  @ApiProperty({ example: 'doctor@email.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'securePassword123' })
  @IsString()
  @MinLength(8, { message: 'Senha deve ter no mínimo 8 caracteres' })
  password: string;

  @ApiProperty({ example: '11999999999' })
  @IsString()
  phone: string;

  @ApiProperty({ example: 'Clínica Vitalle' })
  @IsString()
  clinicName: string;

  @ApiPropertyOptional({ example: '12345678000190' })
  @IsOptional()
  @IsString()
  document?: string;

  @ApiPropertyOptional({ example: 'CRM/SP 123456' })
  @IsOptional()
  @IsString()
  crm?: string;

  @ApiPropertyOptional({ example: 'Cardiologia' })
  @IsOptional()
  @IsString()
  specialty?: string;

  @ApiPropertyOptional({ enum: ['STANDARD', 'PLUS'], default: 'STANDARD' })
  @IsOptional()
  @IsEnum(['STANDARD', 'PLUS'])
  plan?: 'STANDARD' | 'PLUS';

  @ApiPropertyOptional({ enum: ['MONTHLY', 'ANNUAL'], default: 'MONTHLY' })
  @IsOptional()
  @IsEnum(['MONTHLY', 'ANNUAL'])
  billingCycle?: 'MONTHLY' | 'ANNUAL';
}
