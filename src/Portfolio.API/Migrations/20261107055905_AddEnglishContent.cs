using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Portfolio.API.Migrations
{
    /// <inheritdoc />
    public partial class AddEnglishContent : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "BioEn",
                table: "Profiles",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "TitleEn",
                table: "Profiles",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "CompanyEn",
                table: "Experiences",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<List<string>>(
                name: "HighlightsEn",
                table: "Experiences",
                type: "text[]",
                nullable: false,
                defaultValueSql: "'{}'");

            migrationBuilder.AddColumn<string>(
                name: "PeriodEn",
                table: "Experiences",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ProjectNameEn",
                table: "Experiences",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "RoleEn",
                table: "Experiences",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BioEn",
                table: "Profiles");

            migrationBuilder.DropColumn(
                name: "TitleEn",
                table: "Profiles");

            migrationBuilder.DropColumn(
                name: "CompanyEn",
                table: "Experiences");

            migrationBuilder.DropColumn(
                name: "HighlightsEn",
                table: "Experiences");

            migrationBuilder.DropColumn(
                name: "PeriodEn",
                table: "Experiences");

            migrationBuilder.DropColumn(
                name: "ProjectNameEn",
                table: "Experiences");

            migrationBuilder.DropColumn(
                name: "RoleEn",
                table: "Experiences");
        }
    }
}
