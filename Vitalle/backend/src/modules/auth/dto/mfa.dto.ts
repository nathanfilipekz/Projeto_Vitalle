import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, Matches } from 'class-validator';

export class MfaCodeDto {
  @ApiProperty({ example: '123456', description: 'Código TOTP de 6 dígitos do app autenticador.' })
  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/)
  code: string;
}
