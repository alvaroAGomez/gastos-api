import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1726322400000 implements MigrationInterface {
  name = 'InitialSchema1726322400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Primero eliminar todas las tablas existentes para hacer un reset completo
    await queryRunner.query(`DROP VIEW IF EXISTS \`VW_GastosMensualesTarjeta\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`cuota\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`gasto\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`debito_config\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`estado_cuenta\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`tarjeta_credito\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`categoria\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`banco\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`usuario\``);

    // Crear tabla usuario
    await queryRunner.query(`
      CREATE TABLE \`usuario\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`nombre\` varchar(100) NOT NULL,
        \`email\` varchar(100) NOT NULL,
        \`password\` varchar(256) NOT NULL,
        \`fechaRegistro\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        UNIQUE INDEX \`IDX_email_usuario\` (\`email\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);

    // Crear tabla banco
    await queryRunner.query(`
      CREATE TABLE \`banco\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`nombre\` varchar(100) NOT NULL,
        \`logo_url\` varchar(200) NULL,
        \`usuario_id\` int NULL,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);

    // Crear tabla categoria
    await queryRunner.query(`
      CREATE TABLE \`categoria\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`nombre\` varchar(100) NOT NULL,
        \`es_global\` tinyint NOT NULL,
        \`usuario_id\` int NULL,
        \`color_hex\` varchar(7) NULL,
        \`icono\` varchar(100) NULL,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);

    // Crear tabla tarjeta_credito
    await queryRunner.query(`
      CREATE TABLE \`tarjeta_credito\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`nombre\` varchar(100) NOT NULL,
        \`limite_total\` decimal(10,2) NOT NULL,
        \`dia_cierre_default\` int NOT NULL,
        \`dia_vencimiento_default\` int NOT NULL,
        \`ultimos4Digitos\` varchar(4) NULL,
        \`usuario_id\` int NULL,
        \`banco_id\` int NULL,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);

    // Crear tabla estado_cuenta
    await queryRunner.query(`
      CREATE TABLE \`estado_cuenta\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`tarjeta_id\` int NOT NULL,
        \`fecha_cierre\` date NOT NULL,
        \`fecha_vencimiento\` date NOT NULL,
        \`inicio_periodo\` date NOT NULL,
        \`fin_periodo\` date NOT NULL,
        \`estado\` varchar(20) NOT NULL,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);

    // Crear tabla debito_config
    await queryRunner.query(`
      CREATE TABLE \`debito_config\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`usuario_id\` int NOT NULL,
        \`tarjeta_id\` int NOT NULL,
        \`categoria_id\` int NOT NULL,
        \`descripcion\` varchar(200) NOT NULL,
        \`monto\` decimal(10,2) NOT NULL,
        \`moneda\` varchar(3) NOT NULL,
        \`fecha_suscripcion\` date NOT NULL,
        \`activo\` tinyint NOT NULL,
        \`observacion\` text NULL,
        \`periodicidad\` enum('mensual', 'bimestral', 'trimestral', 'semestral', 'anual') NOT NULL DEFAULT 'mensual',
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);

    // Crear tabla gasto
    await queryRunner.query(`
      CREATE TABLE \`gasto\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`usuario_id\` int NOT NULL,
        \`tarjeta_id\` int NOT NULL,
        \`categoria_id\` int NOT NULL,
        \`estado_id\` int NOT NULL,
        \`descripcion\` varchar(200) NOT NULL,
        \`monto\` decimal(10,2) NOT NULL,
        \`moneda\` varchar(3) NOT NULL,
        \`fecha_compra\` date NOT NULL,
        \`es_debito_auto\` tinyint NOT NULL,
        \`debito_config_id\` bigint unsigned NULL,
        \`periodo_mes\` char(7) GENERATED ALWAYS AS (DATE_FORMAT(\`fecha_compra\`, '%Y-%m')) STORED,
        UNIQUE INDEX \`uq_gasto_debito_periodo\` (\`debito_config_id\`, \`periodo_mes\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);

    // Crear tabla cuota
    await queryRunner.query(`
      CREATE TABLE \`cuota\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`gasto_id\` int NOT NULL,
        \`estado_id\` int NOT NULL,
        \`numero\` int NOT NULL,
        \`fecha_cuota\` date NOT NULL,
        \`monto_cuota\` decimal(10,2) NOT NULL,
        \`moneda\` varchar(3) NOT NULL,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);

    // Crear vista VW_GastosMensualesTarjeta
    await queryRunner.query(`
      CREATE VIEW \`VW_GastosMensualesTarjeta\` AS 
      SELECT 
        g.id as gastoId,
        g.fecha_compra as fechaGasto,
        g.descripcion,
        cat.nombre as categoria,
        CASE 
          WHEN COUNT(c.id) > 1 THEN c.monto_cuota
          ELSE g.monto
        END as montoCuota,
        COALESCE(c.numero, 1) as numeroCuota,
        CASE 
          WHEN COUNT(c.id) > 1 THEN (SELECT COUNT(*) FROM cuota WHERE gasto_id = g.id)
          ELSE 1
        END as totalCuotas,
        g.usuario_id as usuarioId,
        g.tarjeta_id as tarjetaId,
        CASE WHEN COUNT(c.id) > 1 THEN 1 ELSE 0 END as esEnCuotas,
        g.categoria_id as categoriaGastoId,
        MIN(c.fecha_cuota) as mesPrimerPago
      FROM gasto g
      LEFT JOIN cuota c ON g.id = c.gasto_id
      LEFT JOIN categoria cat ON g.categoria_id = cat.id
      GROUP BY g.id, c.id
    `);

    // Agregar foreign keys
    await queryRunner.query(`
      ALTER TABLE \`banco\` 
      ADD CONSTRAINT \`FK_banco_usuario\` 
      FOREIGN KEY (\`usuario_id\`) REFERENCES \`usuario\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE \`categoria\` 
      ADD CONSTRAINT \`FK_categoria_usuario\` 
      FOREIGN KEY (\`usuario_id\`) REFERENCES \`usuario\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE \`tarjeta_credito\` 
      ADD CONSTRAINT \`FK_tarjeta_credito_usuario\` 
      FOREIGN KEY (\`usuario_id\`) REFERENCES \`usuario\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE \`tarjeta_credito\` 
      ADD CONSTRAINT \`FK_tarjeta_credito_banco\` 
      FOREIGN KEY (\`banco_id\`) REFERENCES \`banco\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE \`estado_cuenta\` 
      ADD CONSTRAINT \`FK_estado_cuenta_tarjeta\` 
      FOREIGN KEY (\`tarjeta_id\`) REFERENCES \`tarjeta_credito\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE \`debito_config\` 
      ADD CONSTRAINT \`FK_debito_config_usuario\` 
      FOREIGN KEY (\`usuario_id\`) REFERENCES \`usuario\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE \`debito_config\` 
      ADD CONSTRAINT \`FK_debito_config_tarjeta\` 
      FOREIGN KEY (\`tarjeta_id\`) REFERENCES \`tarjeta_credito\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE \`debito_config\` 
      ADD CONSTRAINT \`FK_debito_config_categoria\` 
      FOREIGN KEY (\`categoria_id\`) REFERENCES \`categoria\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE \`gasto\` 
      ADD CONSTRAINT \`FK_gasto_usuario\` 
      FOREIGN KEY (\`usuario_id\`) REFERENCES \`usuario\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE \`gasto\` 
      ADD CONSTRAINT \`FK_gasto_tarjeta\` 
      FOREIGN KEY (\`tarjeta_id\`) REFERENCES \`tarjeta_credito\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE \`gasto\` 
      ADD CONSTRAINT \`FK_gasto_categoria\` 
      FOREIGN KEY (\`categoria_id\`) REFERENCES \`categoria\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE \`gasto\` 
      ADD CONSTRAINT \`FK_gasto_estado\` 
      FOREIGN KEY (\`estado_id\`) REFERENCES \`estado_cuenta\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE \`cuota\` 
      ADD CONSTRAINT \`FK_cuota_gasto\` 
      FOREIGN KEY (\`gasto_id\`) REFERENCES \`gasto\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE \`cuota\` 
      ADD CONSTRAINT \`FK_cuota_estado\` 
      FOREIGN KEY (\`estado_id\`) REFERENCES \`estado_cuenta\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar vista
    await queryRunner.query(`DROP VIEW IF EXISTS \`VW_GastosMensualesTarjeta\``);

    // Eliminar foreign keys
    await queryRunner.query(`ALTER TABLE \`cuota\` DROP FOREIGN KEY \`FK_cuota_estado\``);
    await queryRunner.query(`ALTER TABLE \`cuota\` DROP FOREIGN KEY \`FK_cuota_gasto\``);
    await queryRunner.query(`ALTER TABLE \`gasto\` DROP FOREIGN KEY \`FK_gasto_estado\``);
    await queryRunner.query(`ALTER TABLE \`gasto\` DROP FOREIGN KEY \`FK_gasto_categoria\``);
    await queryRunner.query(`ALTER TABLE \`gasto\` DROP FOREIGN KEY \`FK_gasto_tarjeta\``);
    await queryRunner.query(`ALTER TABLE \`gasto\` DROP FOREIGN KEY \`FK_gasto_usuario\``);
    await queryRunner.query(`ALTER TABLE \`debito_config\` DROP FOREIGN KEY \`FK_debito_config_categoria\``);
    await queryRunner.query(`ALTER TABLE \`debito_config\` DROP FOREIGN KEY \`FK_debito_config_tarjeta\``);
    await queryRunner.query(`ALTER TABLE \`debito_config\` DROP FOREIGN KEY \`FK_debito_config_usuario\``);
    await queryRunner.query(`ALTER TABLE \`estado_cuenta\` DROP FOREIGN KEY \`FK_estado_cuenta_tarjeta\``);
    await queryRunner.query(`ALTER TABLE \`tarjeta_credito\` DROP FOREIGN KEY \`FK_tarjeta_credito_banco\``);
    await queryRunner.query(`ALTER TABLE \`tarjeta_credito\` DROP FOREIGN KEY \`FK_tarjeta_credito_usuario\``);
    await queryRunner.query(`ALTER TABLE \`categoria\` DROP FOREIGN KEY \`FK_categoria_usuario\``);
    await queryRunner.query(`ALTER TABLE \`banco\` DROP FOREIGN KEY \`FK_banco_usuario\``);

    // Eliminar tablas en orden inverso
    await queryRunner.query(`DROP TABLE \`cuota\``);
    await queryRunner.query(`DROP TABLE \`gasto\``);
    await queryRunner.query(`DROP TABLE \`debito_config\``);
    await queryRunner.query(`DROP TABLE \`estado_cuenta\``);
    await queryRunner.query(`DROP TABLE \`tarjeta_credito\``);
    await queryRunner.query(`DROP TABLE \`categoria\``);
    await queryRunner.query(`DROP TABLE \`banco\``);
    await queryRunner.query(`DROP TABLE \`usuario\``);
  }
}
