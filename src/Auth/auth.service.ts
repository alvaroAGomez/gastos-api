import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../Usuario/usuario.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ApiResponse, ApiResponseBuilder } from '../common/response/api-response.builder';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService
  ) {}

  async register(registerDto: RegisterDto): Promise<ApiResponse<{ access_token: string }>> {
    try {
      const user = await this.usersService.create(registerDto);
      const token = this.generateToken(user);
      return ApiResponseBuilder.success(token, 'Usuario registrado exitosamente');
    } catch (error) {
      return ApiResponseBuilder.error(400, error.message, 'Error al registrar el usuario');
    }
  }

  async login(loginDto: LoginDto): Promise<ApiResponse<{ access_token: string }>> {
    try {
      const user = await this.usersService.findByEmail(loginDto.email);
      if (!user) {
        return ApiResponseBuilder.error(401, 'Credenciales inválidas', 'Credenciales inválidas');
      }

      const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
      if (!isPasswordValid) {
        return ApiResponseBuilder.error(401, 'Credenciales inválidas', 'Credenciales inválidas');
      }

      const token = this.generateToken(user);
      return ApiResponseBuilder.success(token, 'Inicio de sesión exitoso');
    } catch (error) {
      return ApiResponseBuilder.error(400, error.message, 'Error al iniciar sesión');
    }
  }

  private generateToken(user: any): { access_token: string } {
    const payload = { sub: user.id, email: user.email };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
