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
    public DbSet<NoteShare> NoteShares { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Note>()
            .HasOne(n => n.User)
            .WithMany(u => u.Notes)
            .HasForeignKey(n => n.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Note>()
            .HasMany(n => n.Collaborators)
            .WithMany()
            .UsingEntity(
                "NoteCollaborators",
                l => l.HasOne(typeof(User)).WithMany().HasForeignKey("UserId").HasPrincipalKey(nameof(User.Id)).OnDelete(DeleteBehavior.NoAction),
                r => r.HasOne(typeof(Note)).WithMany().HasForeignKey("NoteId").HasPrincipalKey(nameof(Note.Id)).OnDelete(DeleteBehavior.Cascade),
                j =>
                {
                    j.HasKey("NoteId", "UserId");
                    j.ToTable("NoteCollaborators");
                });

        modelBuilder.Entity<NoteShare>()
            .HasOne(ns => ns.Note)
            .WithMany(n => n.SharedWith)
            .HasForeignKey(ns => ns.NoteId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<NoteShare>()
            .HasOne(ns => ns.User)
            .WithMany()
            .HasForeignKey(ns => ns.UserId)
            .OnDelete(DeleteBehavior.NoAction);
    }
}