import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSubscriptionFields1686139200000 implements MigrationInterface {
  name = 'AddSubscriptionFields1686139200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE \`gasto\` 
            ADD COLUMN \`es_suscripcion\` tinyint NOT NULL DEFAULT 0,
            ADD COLUMN \`gasto_recurrente_id\` int NULL,
            ADD CONSTRAINT \`FK_gasto_gasto_recurrente\` 
            FOREIGN KEY (\`gasto_recurrente_id\`) REFERENCES \`gasto_recurrente\`(\`id\`) 
            ON DELETE SET NULL ON UPDATE CASCADE
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE \`gasto\` 
            DROP FOREIGN KEY \`FK_gasto_gasto_recurrente\`;
            ALTER TABLE \`gasto\` 
            DROP COLUMN \`es_suscripcion\`,
            DROP COLUMN \`gasto_recurrente_id\`
        `);
  }
}
