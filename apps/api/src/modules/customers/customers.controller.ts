import {
  customerSchema,
  idSchema,
  paginatedResponseSchema,
  type Customer,
  type PaginatedResponse,
} from '@calce/types';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { Roles } from '@/common/decorators';
import { ZodValidationPipe } from '@/common/pipes';
import { ApiZodBody, ApiZodErrorResponse, ApiZodQuery, ApiZodResponse } from '@/common/swagger';
import { CustomersService } from './customers.service';
import { createCustomerDtoSchema, type CreateCustomerDto } from './dto/create-customer.dto';
import { queryCustomersDtoSchema, type QueryCustomersDto } from './dto/query-customers.dto';
import { updateCustomerDtoSchema, type UpdateCustomerDto } from './dto/update-customer.dto';

/** Lectura para todo usuario autenticado; modificaciones solo ADMIN. */
@ApiTags('customers')
@ApiBearerAuth()
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @ApiOperation({ summary: 'Listado paginado de clientes con busqueda y ordenamiento' })
  @ApiZodQuery(queryCustomersDtoSchema)
  @ApiZodResponse(HttpStatus.OK, paginatedResponseSchema(customerSchema), 'Clientes encontrados')
  list(
    @Query(new ZodValidationPipe(queryCustomersDtoSchema)) query: QueryCustomersDto,
  ): Promise<PaginatedResponse<Customer>> {
    return this.customersService.list(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar datos comerciales y fiscales del cliente' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiZodResponse(HttpStatus.OK, customerSchema, 'Cliente encontrado')
  @ApiZodErrorResponse(HttpStatus.NOT_FOUND, 'Cliente inexistente')
  findOne(@Param('id', new ZodValidationPipe(idSchema)) id: string): Promise<Customer> {
    return this.customersService.findOne(id);
  }

  @Post()
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear cliente (ADMIN)' })
  @ApiZodBody(createCustomerDtoSchema)
  @ApiZodResponse(HttpStatus.CREATED, customerSchema, 'Cliente creado')
  @ApiZodErrorResponse(HttpStatus.CONFLICT, 'CUIT ya registrado')
  create(
    @Body(new ZodValidationPipe(createCustomerDtoSchema)) dto: CreateCustomerDto,
  ): Promise<Customer> {
    return this.customersService.create(dto);
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Editar o reactivar un cliente (ADMIN)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiZodBody(updateCustomerDtoSchema)
  @ApiZodResponse(HttpStatus.OK, customerSchema, 'Cliente actualizado')
  @ApiZodErrorResponse(HttpStatus.NOT_FOUND, 'Cliente inexistente')
  update(
    @Param('id', new ZodValidationPipe(idSchema)) id: string,
    @Body(new ZodValidationPipe(updateCustomerDtoSchema)) dto: UpdateCustomerDto,
  ): Promise<Customer> {
    return this.customersService.update(id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Dar de baja logica un cliente (ADMIN)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiZodErrorResponse(HttpStatus.NOT_FOUND, 'Cliente inexistente')
  deactivate(@Param('id', new ZodValidationPipe(idSchema)) id: string): Promise<void> {
    return this.customersService.deactivate(id);
  }
}
