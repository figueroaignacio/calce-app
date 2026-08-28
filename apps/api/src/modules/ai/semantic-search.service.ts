/**
 * SemanticSearchService - pendiente de implementacion.
 *
 * Es la respuesta al primer problema del dominio: que buscar un repuesto no
 * dependa de saber como fue cargado. La busqueda por tokens que hoy tiene
 * `ProductsRepository` resuelve el caso literal; esto resuelve el caso en que
 * el vendedor describe la pieza con otras palabras.
 *
 * Firma prevista:
 *
 * @Injectable()
 * export class SemanticSearchService {
 *   constructor(
 *     private readonly embeddings: EmbeddingsService,
 *     @Inject(DATABASE) private readonly db: Database,
 *   ) {}
 *
 *   // Busca por similitud coseno contra `products.embedding`, usando el
 *   // indice HNSW. `limit` acota el resultado y `minScore` descarta ruido.
 *   searchByText(query: string, limit: number, minScore: number): Promise<ProductListItem[]>;
 *
 *   // Combina la busqueda literal por tokens con la semantica y fusiona
 *   // ambos rankings.
 *   hybridSearch(query: QueryProductsInput): Promise<PaginatedResponse<ProductListItem>>;
 * }
 *
 * Puntos a resolver antes de escribirlo:
 * - Definir el peso relativo entre coincidencia literal y semantica.
 * - Filtrar por compatibilidad vehicular antes de rankear, no despues: un
 *   resultado muy parecido que no entra en el auto del cliente no sirve.
 */
export {};
