import { MigrationInterface, QueryRunner } from 'typeorm';

export class EventLog1760000000000 implements MigrationInterface {
  name = 'EventLog1760000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "event_log" (
        "id" SERIAL NOT NULL,
        "type" character varying(200) NOT NULL,
        "payload" jsonb NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_event_log_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_event_log_type" ON "event_log" ("type")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_event_log_createdAt" ON "event_log" ("createdAt")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_event_log_createdAt"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_event_log_type"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "event_log"`);
  }
}

