import {
  idSchema,
  paginatedResponseSchema,
  productDetailSchema,
  productListItemSchema,
  type PaginatedResponse,
  type ProductDetail,
  type ProductListItem,
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
import { createProductDtoSchema, type CreateProductDto } from './dto/create-product.dto';
import { queryProductsDtoSchema, type QueryProductsDto } from './dto/query-products.dto';
import { updateProductDtoSchema, type UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';

/**
 * Rutas del catalogo.
 *
 * El controller solo traduce HTTP: valida la entrada contra el contrato,
 * documenta la ruta y delega. Cualquier decision de negocio va en el service.
 */
@ApiTags('products')
@ApiBearerAuth()
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'Lista productos con paginacion, filtros y orden' })
  @ApiZodQuery(queryProductsDtoSchema)
  @ApiZodResponse(
    HttpStatus.OK,
    paginatedResponseSchema(productListItemSchema),
    'Pagina de productos',
  )
  list(
    @Query(new ZodValidationPipe(queryProductsDtoSchema)) query: QueryProductsDto,
  ): Promise<PaginatedResponse<ProductListItem>> {
    return this.productsService.list(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Ficha completa con codigos y aplicaciones vehiculares' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiZodResponse(HttpStatus.OK, productDetailSchema, 'Producto encontrado')
  @ApiZodErrorResponse(HttpStatus.NOT_FOUND, 'El producto no existe')
  findOne(@Param('id', new ZodValidationPipe(idSchema)) id: string): Promise<ProductDetail> {
    return this.productsService.findOne(id);
  }

  @Post()
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crea un producto con sus codigos y aplicaciones' })
  @ApiZodBody(createProductDtoSchema)
  @ApiZodResponse(HttpStatus.CREATED, productDetailSchema, 'Producto creado')
  @ApiZodErrorResponse(HttpStatus.CONFLICT, 'El SKU ya esta en uso')
  create(
    @Body(new ZodValidationPipe(createProductDtoSchema)) dto: CreateProductDto,
  ): Promise<ProductDetail> {
    return this.productsService.create(dto);
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Actualiza un producto' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiZodBody(updateProductDtoSchema)
  @ApiZodResponse(HttpStatus.OK, productDetailSchema, 'Producto actualizado')
  @ApiZodErrorResponse(HttpStatus.NOT_FOUND, 'El producto no existe')
  update(
    @Param('id', new ZodValidationPipe(idSchema)) id: string,
    @Body(new ZodValidationPipe(updateProductDtoSchema)) dto: UpdateProductDto,
  ): Promise<ProductDetail> {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Da de baja logica un producto' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiZodErrorResponse(HttpStatus.NOT_FOUND, 'El producto no existe')
  deactivate(@Param('id', new ZodValidationPipe(idSchema)) id: string): Promise<void> {
    return this.productsService.deactivate(id);
  }
}
