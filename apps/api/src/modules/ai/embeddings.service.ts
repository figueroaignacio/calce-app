/**
 * EmbeddingsService - pendiente de implementacion.
 *
 * Se encarga de mantener sincronizada la columna `products.embedding` con la
 * descripcion normalizada del producto. El modelo de embeddings ya esta
 * inyectable via el token `AI_MODELS`, y la columna y su indice HNSW ya existen
 * en el esquema, asi que lo unico que falta es este servicio.
 *
 * Firma prevista:
 *
 * @Injectable()
 * export class EmbeddingsService {
 *   constructor(
 *     @Inject(AI_MODELS) private readonly models: AiModels,
 *     @Inject(DATABASE) private readonly db: Database,
 *   ) {}
 *
 *   // Calcula el vector de un texto suelto.
 *   embedText(text: string): Promise<number[]>;
 *
 *   // Calcula y persiste el embedding de un producto. Se llama al crearlo y
 *   // cada vez que cambia su descripcion.
 *   embedProduct(productId: string): Promise<void>;
 *
 *   // Backfill por lotes para el catalogo ya cargado. Devuelve cuantos
 *   // productos quedaron indexados.
 *   embedPendingProducts(batchSize: number): Promise<number>;
 * }
 *
 * Puntos a resolver antes de escribirlo:
 * - El modelo de `AI_EMBEDDING_MODEL` tiene que producir vectores de 1536
 *   dimensiones, que
 *   es el ancho declarado en la columna.
 * - El backfill conviene correrlo fuera del ciclo de request.
 */
export {};
