import { Controller, Post, Body, HttpCode, HttpStatus, Req, UseGuards, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { MfaService } from './mfa.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { MfaCodeDto } from './dto/mfa.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly mfaService: MfaService,
  ) {}

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login (retorna requiresMfa quando o usuário tem MFA ativo)' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto, @Req() req: any) {
    return this.authService.login(loginDto, req.ip, req.headers['user-agent']);
  }

  @Post('login/mfa')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Conclui login após validar código MFA do usuário.' })
  async loginMfa(@Body() body: { userId: string; code: string }, @Req() req: any) {
    return this.authService.completeMfaLogin(
      body.userId,
      body.code,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Post('register')
  @Public()
  @ApiOperation({ summary: 'Register new tenant and user' })
  @ApiResponse({ status: 201, description: 'Registration successful' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout and revoke refresh token' })
  async logout(@Body() body: { refreshToken: string }) {
    return this.authService.logout(body.refreshToken);
  }

  // ---------------- MFA ----------------

  @Post('mfa/setup')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Inicia setup de MFA (gera secret + otpauth URI).' })
  async mfaSetup(@CurrentUser() user: any) {
    return this.mfaService.beginSetup(user.id);
  }

  @Post('mfa/verify')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Confirma o setup, ativando o MFA na conta.' })
  async mfaVerify(@CurrentUser() user: any, @Body() body: MfaCodeDto) {
    return this.mfaService.verifySetup(user.id, body.code);
  }

  @Post('mfa/disable')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Desativa MFA (precisa do código atual).' })
  async mfaDisable(@CurrentUser() user: any, @Body() body: MfaCodeDto) {
    return this.mfaService.disable(user.id, body.code);
  }

  @Get('mfa/status')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retorna se o usuário atual tem MFA ativo.' })
  async mfaStatus(@CurrentUser() user: any) {
    return { enabled: !!user.mfaEnabled };
  }
}
