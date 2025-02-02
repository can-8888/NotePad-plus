using Microsoft.EntityFrameworkCore;
using NotepadPlusApi.Models;

namespace NotepadPlusApi.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }
        
        public DbSet<Folder> Folders { get; set; }
        
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            // Add any entity configurations here
        }
    }
} 