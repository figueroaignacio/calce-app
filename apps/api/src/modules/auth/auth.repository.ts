import { type Database, users } from '@calce/db';
import { type User, type UserRole } from '@calce/types';
import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DATABASE } from '@/database/database.provider';

/** Usuario con su hash, para uso exclusivo de la verificacion de credenciales. */
export interface UserWithSecret extends User {
  passwordHash: string;
}

export interface CreateUserRecord {
  email: string;
  name: string;
  role: UserRole;
  passwordHash: string;
}

type UserRow = typeof users.$inferSelect;

function toUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    isActive: row.isActive,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toUserWithSecret(row: UserRow): UserWithSecret {
  return { ...toUser(row), passwordHash: row.passwordHash };
}

/**
 * Unico lugar del modulo que habla con Drizzle. Devuelve entidades del dominio
 * ya mapeadas, nunca filas crudas.
 */
@Injectable()
export class AuthRepository {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async findByEmail(email: string): Promise<UserWithSecret | null> {
    const [row] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    return row ? toUserWithSecret(row) : null;
  }

  async findById(id: string): Promise<User | null> {
    const [row] = await this.db.select().from(users).where(eq(users.id, id)).limit(1);

    return row ? toUser(row) : null;
  }

  async existsByEmail(email: string): Promise<boolean> {
    const [row] = await this.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    return row !== undefined;
  }

  async create(record: CreateUserRecord): Promise<User> {
    const [row] = await this.db
      .insert(users)
      .values({
        email: record.email.toLowerCase(),
        name: record.name,
        role: record.role,
        passwordHash: record.passwordHash,
      })
      .returning();

    if (!row) {
      throw new Error('El motor no devolvio el usuario recien creado');
    }

    return toUser(row);
  }
}
