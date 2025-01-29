using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Migrations.Operations;
using System.Linq;

namespace NotepadPlusApi.Data
{
    public static class MigrationExtensions
    {
        public static bool GetTableExists(this MigrationBuilder migrationBuilder, string tableName)
        {
            return migrationBuilder.Operations.OfType<CreateTableOperation>()
                .Any(o => o.Name == tableName);
        }

        public static bool GetColumnExists(this MigrationBuilder migrationBuilder, string tableName, string columnName)
        {
            return migrationBuilder.Operations.OfType<AddColumnOperation>()
                .Any(o => o.Table == tableName && o.Name == columnName);
        }
    }
} 