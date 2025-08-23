import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateSchemaToNewModel1692832800000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop old tables and their relationships first
    await queryRunner.query(`DROP TABLE IF EXISTS "gasto_recurrente"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "tarjeta_debito"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "cuota"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "gasto"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "categoria_gasto"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "tarjeta_credito"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "banco"`);

    // Create new tables in order of dependencies

    // Banco table
    await queryRunner.query(`
      CREATE TABLE "banco" (
        "id" SERIAL PRIMARY KEY,
        "nombre" varchar(100) NOT NULL,
        "logo_url" varchar(200),
        "usuario_id" integer REFERENCES "usuario"(id)
      )
    `);

    // Categoria table
    await queryRunner.query(`
      CREATE TABLE "categoria" (
        "id" SERIAL PRIMARY KEY,
        "nombre" varchar(100) NOT NULL,
        "es_global" boolean NOT NULL,
        "usuario_id" integer REFERENCES "usuario"(id),
        "color_hex" varchar(7),
        "icono" varchar(100)
      )
    `);

    // TarjetaCredito table
    await queryRunner.query(`
      CREATE TABLE "tarjeta_credito" (
        "id" SERIAL PRIMARY KEY,
        "nombre" varchar(100) NOT NULL,
        "limite_total" decimal(10,2) NOT NULL,
        "dia_cierre_default" integer NOT NULL,
        "dia_vencimiento_default" integer NOT NULL,
        "usuario_id" integer REFERENCES "usuario"(id),
        "banco_id" integer REFERENCES "banco"(id)
      )
    `);

    // EstadoCuenta table
    await queryRunner.query(`
      CREATE TABLE "estado_cuenta" (
        "id" SERIAL PRIMARY KEY,
        "tarjeta_id" integer REFERENCES "tarjeta_credito"(id),
        "fecha_cierre" date NOT NULL,
        "fecha_vencimiento" date NOT NULL,
        "inicio_periodo" date NOT NULL,
        "fin_periodo" date NOT NULL,
        "estado" varchar(20) NOT NULL
      )
    `);

    // DebitoConfig table
    await queryRunner.query(`
      CREATE TABLE "debito_config" (
        "id" SERIAL PRIMARY KEY,
        "usuario_id" integer REFERENCES "usuario"(id),
        "tarjeta_id" integer REFERENCES "tarjeta_credito"(id),
        "categoria_id" integer REFERENCES "categoria"(id),
        "descripcion" varchar(200) NOT NULL,
        "monto" decimal(10,2) NOT NULL,
        "moneda" varchar(3) NOT NULL,
        "fecha_suscripcion" date NOT NULL,
        "activo" boolean NOT NULL,
        "observacion" text
      )
    `);

    // Gasto table
    await queryRunner.query(`
      CREATE TABLE "gasto" (
        "id" SERIAL PRIMARY KEY,
        "usuario_id" integer REFERENCES "usuario"(id),
        "tarjeta_id" integer REFERENCES "tarjeta_credito"(id),
        "categoria_id" integer REFERENCES "categoria"(id),
        "estado_id" integer REFERENCES "estado_cuenta"(id),
        "descripcion" varchar(200) NOT NULL,
        "monto" decimal(10,2) NOT NULL,
        "moneda" varchar(3) NOT NULL,
        "fecha_compra" date NOT NULL,
        "es_debito_auto" boolean NOT NULL
      )
    `);

    // Cuota table
    await queryRunner.query(`
      CREATE TABLE "cuota" (
        "id" SERIAL PRIMARY KEY,
        "gasto_id" integer REFERENCES "gasto"(id),
        "estado_id" integer REFERENCES "estado_cuenta"(id),
        "numero" integer NOT NULL,
        "fecha_cuota" date NOT NULL,
        "monto_cuota" decimal(10,2) NOT NULL,
        "moneda" varchar(3) NOT NULL
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop new tables in reverse order
    await queryRunner.query(`DROP TABLE IF EXISTS "cuota"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "gasto"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "debito_config"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "estado_cuenta"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "tarjeta_credito"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "categoria"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "banco"`);
  }
}
