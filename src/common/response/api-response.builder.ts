export interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: string | string[];
  status: number;
  message: string;
}

export class ApiResponseBuilder<T> {
  private response: ApiResponse<T>;

  constructor() {
    this.response = {
      ok: true,
      status: 200,
      message: 'Operación exitosa',
    };
  }

  success(data: T, message?: string): ApiResponse<T> {
    return {
      ok: true,
      data,
      status: 200,
      message: message || 'Operación exitosa',
    };
  }

  error(status: number, error: string | string[], message?: string): ApiResponse<T> {
    return {
      ok: false,
      error,
      status,
      message: message || 'Error en la operación',
    };
  }

  notFound(message?: string): ApiResponse<T> {
    return this.error(404, 'Recurso no encontrado', message);
  }

  badRequest(error: string | string[], message?: string): ApiResponse<T> {
    return this.error(400, error, message);
  }

  unauthorized(message?: string): ApiResponse<T> {
    return this.error(401, 'No autorizado', message);
  }

  forbidden(message?: string): ApiResponse<T> {
    return this.error(403, 'Acceso denegado', message);
  }

  static success<T>(data: T, message?: string): ApiResponse<T> {
    return new ApiResponseBuilder<T>().success(data, message);
  }

  static error<T>(status: number, error: string | string[], message?: string): ApiResponse<T> {
    return new ApiResponseBuilder<T>().error(status, error, message);
  }
}
