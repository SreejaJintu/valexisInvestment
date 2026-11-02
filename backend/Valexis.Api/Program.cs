using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Valexis.Application.Interfaces;
using Valexis.Application.Services;
using Valexis.Api.BackgroundServices;
using Valexis.Infrastructure.Data;

var builder = WebApplication.CreateBuilder(args);

// 1. Database Context
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
    ?? "Server=(localdb)\\MSSQLLocalDB;Database=ValexisDb;Trusted_Connection=True;MultipleActiveResultSets=true;TrustServerCertificate=True";

builder.Services.AddDbContext<ValexisDbContext>(options =>
{
    options.UseSqlServer(connectionString);
});

builder.Services.AddScoped<IApplicationDbContext>(sp => sp.GetRequiredService<ValexisDbContext>());

// 2. JWT Authentication
var jwtSecret = builder.Configuration["JwtSettings:Secret"] ?? "ValexisSuperSecretKey_UltraSecureFinancialKey_2026!#*99ValexisPlatform";
var jwtIssuer = builder.Configuration["JwtSettings:Issuer"] ?? "ValexisApi";
var jwtAudience = builder.Configuration["JwtSettings:Audience"] ?? "ValexisClient";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
        ValidateIssuer = true,
        ValidIssuer = jwtIssuer,
        ValidateAudience = true,
        ValidAudience = jwtAudience,
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("RequireAdminRole", policy => policy.RequireRole("Admin"));
    options.AddPolicy("RequireUserRole", policy => policy.RequireRole("User"));
});

// 3. Application Services
builder.Services.AddScoped<IJwtService, JwtService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IInvestmentService, InvestmentService>();
builder.Services.AddScoped<IRoiEngineService, RoiEngineService>();
builder.Services.AddScoped<IPayoutService, PayoutService>();
builder.Services.AddScoped<ICommunityService, CommunityService>();
builder.Services.AddHostedService<DailyRoiHostedService>();

// 4. CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.SetIsOriginAllowed(origin => true) // Allows localhost and production frontend (Cloudflare Pages, etc.)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

builder.Services.AddControllers();

var app = builder.Build();

// Seed Admin User
using (var scope = app.Services.CreateScope())
{
    try
    {
        var authService = scope.ServiceProvider.GetRequiredService<IAuthService>();
        await authService.EnsureAdminUserSeededAsync();
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[Startup Warning] Admin seed skipped/error: {ex.Message}");
    }
}

app.UseCors("AllowFrontend");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
