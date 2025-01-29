using Microsoft.EntityFrameworkCore;
using NotepadPlusApi.Models;

namespace NotepadPlusApi.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        if (!optionsBuilder.IsConfigured)
        {
            optionsBuilder.UseSqlServer("Server=.\\SQLEXPRESS;Database=NotepadPlus;User ID=8888;Password=R@nd0mnote;TrustServerCertificate=True");
        }
    }

    public DbSet<User> Users { get; set; } = null!;
    public DbSet<Note> Notes { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Note>()
            .HasOne(n => n.User)
            .WithMany(u => u.Notes)
            .HasForeignKey(n => n.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<User>()
            .HasMany(u => u.CollaborativeNotes)
            .WithMany(n => n.Collaborators)
            .UsingEntity(
                "NoteCollaborators",
                j => j
                    .HasOne(typeof(Note))
                    .WithMany()
                    .HasForeignKey("NoteId")
                    .OnDelete(DeleteBehavior.NoAction),
                j => j
                    .HasOne(typeof(User))
                    .WithMany()
                    .HasForeignKey("UserId")
                    .OnDelete(DeleteBehavior.NoAction)
            );
    }
}