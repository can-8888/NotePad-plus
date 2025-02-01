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
    public DbSet<NotePermission> NotePermissions { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Note>()
            .HasOne(n => n.Owner)
            .WithMany()
            .HasForeignKey(n => n.OwnerId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Note>()
            .HasMany(n => n.Collaborators)
            .WithMany()
            .UsingEntity<Dictionary<string, object>>(
                "NoteCollaborators",
                j => j
                    .HasOne<User>()
                    .WithMany()
                    .HasForeignKey("UserId")
                    .OnDelete(DeleteBehavior.NoAction),
                j => j
                    .HasOne<Note>()
                    .WithMany()
                    .HasForeignKey("NoteId")
                    .OnDelete(DeleteBehavior.Cascade),
                j =>
                {
                    j.HasKey("NoteId", "UserId");
                    j.ToTable("NoteCollaborators");
                }
            );

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

        modelBuilder.Entity<NotePermission>()
            .HasOne(np => np.Note)
            .WithMany(n => n.Permissions)
            .HasForeignKey(np => np.NoteId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<NotePermission>()
            .HasOne(np => np.User)
            .WithMany()
            .HasForeignKey(np => np.UserId)
            .OnDelete(DeleteBehavior.NoAction);

        modelBuilder.Entity<NotePermission>()
            .HasIndex(np => new { np.NoteId, np.UserId })
            .IsUnique();
    }
}