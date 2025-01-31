using Microsoft.EntityFrameworkCore;
using NotepadPlusApi.Data;
using NotepadPlusApi.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Register NoteService
builder.Services.AddScoped<INoteService, NoteService>();

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader());
});

var app = builder.Build();

// Configure middleware order is important
app.UseRouting();
app.UseCors("AllowAll");

// Map controllers
app.MapControllers();

app.Run();