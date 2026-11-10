using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Portfolio.API.Migrations
{
    /// <inheritdoc />
    public partial class AdminV2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // The old rows were sample data nothing read (demo links to khoi.dev); the seed refills the table
            // with the real projects from content/projects.json on the next start.
            migrationBuilder.Sql("DELETE FROM \"Projects\";");

            migrationBuilder.DropColumn(
                name: "CoverImageKey",
                table: "Projects");

            migrationBuilder.DropColumn(
                name: "DemoUrl",
                table: "Projects");

            migrationBuilder.DropColumn(
                name: "DescriptionMdx",
                table: "Projects");

            migrationBuilder.DropColumn(
                name: "GithubUrl",
                table: "Projects");

            migrationBuilder.DropColumn(
                name: "IsFeatured",
                table: "Projects");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "Projects");

            migrationBuilder.DropColumn(
                name: "Summary",
                table: "Projects");

            migrationBuilder.DropColumn(
                name: "TechStack",
                table: "Projects");

            migrationBuilder.DropColumn(
                name: "Title",
                table: "Projects");

            migrationBuilder.DropColumn(
                name: "ViewCount",
                table: "Projects");

            migrationBuilder.RenameColumn(
                name: "CreatedAt",
                table: "Projects",
                newName: "UpdatedAt");

            migrationBuilder.AddColumn<string>(
                name: "Content",
                table: "Projects",
                type: "jsonb",
                nullable: false,
                defaultValue: "{}");

            migrationBuilder.AddColumn<bool>(
                name: "IsTest",
                table: "ChatSessions",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateTable(
                name: "NowItems",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Label = table.Column<string>(type: "text", nullable: false),
                    LabelEn = table.Column<string>(type: "text", nullable: false),
                    Text = table.Column<string>(type: "text", nullable: false),
                    TextEn = table.Column<string>(type: "text", nullable: false),
                    Order = table.Column<int>(type: "integer", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NowItems", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "NowItems");

            migrationBuilder.DropColumn(
                name: "Content",
                table: "Projects");

            migrationBuilder.DropColumn(
                name: "IsTest",
                table: "ChatSessions");

            migrationBuilder.RenameColumn(
                name: "UpdatedAt",
                table: "Projects",
                newName: "CreatedAt");

            migrationBuilder.AddColumn<string>(
                name: "CoverImageKey",
                table: "Projects",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "DemoUrl",
                table: "Projects",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DescriptionMdx",
                table: "Projects",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "GithubUrl",
                table: "Projects",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsFeatured",
                table: "Projects",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "Projects",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Summary",
                table: "Projects",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "TechStack",
                table: "Projects",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Title",
                table: "Projects",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "ViewCount",
                table: "Projects",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }
    }
}
