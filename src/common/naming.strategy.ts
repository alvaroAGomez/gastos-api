import { DefaultNamingStrategy, NamingStrategyInterface, Table } from 'typeorm';
import { snakeCase } from 'typeorm/util/StringUtils';

export class CustomNamingStrategy extends DefaultNamingStrategy implements NamingStrategyInterface {
  foreignKeyName(
    tableOrName: Table | string,
    columnNames: string[],
    referencedTablePath?: string,
    referencedColumnNames?: string[]
  ): string {
    const tableName = typeof tableOrName === 'string' ? tableOrName : tableOrName.name;
    const cols = columnNames.map((c) => snakeCase(c)).join('_');
    const referencedTable = referencedTablePath ? snakeCase(referencedTablePath) : '';
    const refCols = referencedColumnNames ? referencedColumnNames.map((c) => snakeCase(c)).join('_') : '';
    return `fk_${tableName}_${cols}_${referencedTable}_${refCols}`;
  }

  indexName(tableOrName: Table | string, columns: string[]): string {
    const tableName = typeof tableOrName === 'string' ? tableOrName : tableOrName.name;
    const cols = columns.map((c) => snakeCase(c)).join('_');
    return `idx_${tableName}_${cols}`;
  }
}
